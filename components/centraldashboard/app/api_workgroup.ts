import {V1Namespace} from '@kubernetes/client-node';
import {Router, Request, Response, NextFunction} from 'express';
import {Binding as WorkgroupBinding, DefaultApi} from './clients/profile_controller';
import {KubernetesService, PlatformInfo} from './k8s_service';

import {
    apiError,
    ERRORS,
} from './api';

// From: https://stackoverflow.com/a/201378
const EMAIL_RGX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

// Valid actions for handling a contributor
type ContributorActions = 'create' | 'remove';

interface CreateProfileRequest {
    namespace?: string;
    user?: string;
}

interface AddOrRemoveContributorRequest {
    contributor?: string;
}

interface HasWorkgroupResponse {
    user: string;
    hasAuth: boolean;
    hasWorkgroup: boolean;
    registrationFlowAllowed: boolean;
}

interface EnvironmentInfo {
    namespaces: SimpleBinding[];
    platform: PlatformInfo;
    user: string;
    isClusterAdmin: boolean;
}

export type SimpleRole = 'owner'| 'contributor';
export type WorkgroupRole = 'admin' | 'edit';
export type Role = SimpleRole | WorkgroupRole;
export const roleMap: ReadonlyMap<Role, Role> = new Map([
    ['admin', 'owner'],
    ['owner', 'admin'],
    ['edit', 'contributor'],
    ['contributor', 'edit'],
]);

export interface SimpleBinding {
    namespace: string;
    role: SimpleRole;
    user: string;
}

export interface WorkgroupInfo {
    namespaces: SimpleBinding[];
    isClusterAdmin: boolean;
}

/**
 * Converts Workgroup Binding from Profile Controller to SimpleBinding
 */
export function mapWorkgroupBindingToSimpleBinding (bindings: WorkgroupBinding[]): SimpleBinding[] {
    return bindings.map((n) => ({
        user: n.user.name,
        namespace: n.referredNamespace,
        role: roleMap.get(n.roleRef.name as Role) as SimpleRole,
    }));
}

/**
 * Converts Kubernetes Namespace types to SimpleBinding to ensure
 * compatibility between identity-aware and non-identity aware clusters
 */
export function mapNamespacesToSimpleBinding (user: string, namespaces: V1Namespace[]): SimpleBinding[] {
    return namespaces.map((n) => ({
        user,
        namespace: n.metadata.name,
        role: 'contributor',
    }));
}

/**
 * Converts SimpleBinding to Workgroup Binding from Profile Controller
 */
export function mapSimpleBindingToWorkgroupBinding (binding: SimpleBinding): WorkgroupBinding {
    const {user, namespace, role} = binding;
    return {
        user: {
            kind: 'User',
            name: user,
        },
        referredNamespace: namespace,
        roleRef: {
            kind: 'ClusterRole',
            name: roleMap.get(role) as WorkgroupRole,
        }
    };
}

/**
 * Handles an exception in an async block and converts it to a JSON
 * response sent back to client
 */
// tslint:disable-next-line: no-any
const surfaceProfileControllerErrors = (info: {res: Response, msg: string, err: any}) => {
    const {res, msg, err} = info;
    const code = (err.response && err.response.statusCode) || 400;
    const devError = err.body || '';
    // Msg is the developer reason of what happened, devError is the technical details as to why
    console.error(msg+(devError?` ${devError}`:''), err.stack?err:'');
    apiError({res, code, error: devError || msg});
};

export class WorkgroupApi {
    private platformInfo: PlatformInfo;
    constructor(
        private profilesService: DefaultApi,
        private k8sService: KubernetesService,
        private registrationFlowAllowed: boolean) {}
    /** Retrieves and memoizes the PlatformInfo. */
    private async getPlatformInfo(): Promise<PlatformInfo> {
        if (!this.platformInfo) {
           this.platformInfo = await this.k8sService.getPlatformInfo();
        }
        return this.platformInfo;
    }

    /**
     * Builds EnvironmentInfo for the case with identity awareness
     */
    private async getProfileAwareEnv(user: User.User): Promise<EnvironmentInfo> {
        const [platform, {namespaces, isClusterAdmin}] = await Promise.all([
            this.getPlatformInfo(),
            this.getWorkgroupInfo(
                user,
            ),
        ]);
        return {user: user.email, platform, namespaces, isClusterAdmin};
    }

    /**
     * Builds EnvironmentInfo for the case without identity awareness
     */
    private async getBasicEnvironment(user: User.User): Promise<EnvironmentInfo> {
        const [platform, namespaces] = await Promise.all([
            this.getPlatformInfo(),
            this.getAllWorkgroups(user.email),
        ]);
        return {
            user: user.email,
            platform,
            namespaces,
            isClusterAdmin: true,
        };
    }
    /**
     * Retrieves all namespaces in case of basic auth.
     */
    async getAllWorkgroups(fakeUser: string): Promise<SimpleBinding[]> {
        const bindings = await this.profilesService.readBindings();
        const namespaces = mapWorkgroupBindingToSimpleBinding(
            bindings.body.bindings || []
        );
        const names = new Set(namespaces.map((n) => n.namespace));
        return Array.from(names).map((n) => ({
            namespace: n,
            role: 'contributor',
            user: fakeUser,
        }));
    }
    /**
     * Retrieves WorkgroupInfo from Profile Controller for the given user.
     */
    async getWorkgroupInfo(user: User.User): Promise<WorkgroupInfo> {
        const [adminResponse, bindings] = await Promise.all([
            this.profilesService.v1RoleClusteradminGet(user.email),
            this.profilesService.readBindings(user.email),
        ]);
        const namespaces = mapWorkgroupBindingToSimpleBinding(
            bindings.body.bindings || []
        );
        return {
            isClusterAdmin: adminResponse.body,
            namespaces,
        };
    }
    async handleContributor(action: ContributorActions, req: Request, res: Response) {
        const {namespace} = req.params;
        const {contributor} = req.body as AddOrRemoveContributorRequest;
        const {profilesService} = this;
        if (!contributor || !namespace) {
            const missing = [];
            // tslint:disable: no-unused-expression
            contributor || missing.push('contributor');
            namespace || missing.push('namespace');
            // tslint:enable: no-unused-expression
            return apiError({
                res,
                error: `Missing ${missing.join(' and ')} field${missing.length-1?'s':''}.`,
            });
        }
        if (!EMAIL_RGX.test(contributor)) {
            return apiError({
                res,
                error: `Contributor doesn't look like a valid email address`,
            });
        }
        let errIndex = 0;
        try {
            const binding = mapSimpleBindingToWorkgroupBinding({
                user: contributor,
                namespace,
                role: 'contributor',
            });
            const {headers} = req;
            delete headers['content-length'];
            const actionAPI = action === 'create' ? 'createBinding' : 'deleteBinding';
            await profilesService[actionAPI](binding, {headers});
            errIndex++;
            const users = await this.getContributors(namespace);
            res.json(users);
        } catch (err) {
            const errMessage = [
                `Unable to add new contributor for ${namespace}: ${err.stack || err}`,
                `Unable to fetch contributors for ${namespace}: ${err.stack || err}`,
            ][errIndex];
            surfaceProfileControllerErrors({
                res,
                msg: errMessage,
                err,
            });
        }
    }
    /**
     * Given an owned namespace, list all contributors under it
     * @param namespace Namespace to find contributors for
     */
    async getContributors(namespace: string) {
        const {body} = await this.profilesService
            .readBindings(undefined, namespace);
        const users = mapWorkgroupBindingToSimpleBinding(body.bindings)
            .filter((b) => b.role === 'contributor')
            .map((b) => b.user);
        return users;
    }
    routes() {return Router()
        .get('/exists', async (req: Request, res: Response) => {
            try {
                const response: HasWorkgroupResponse = {
                    hasAuth: req.user.hasAuth,
                    user: req.user.username,
                    hasWorkgroup: false,
                    registrationFlowAllowed: this.registrationFlowAllowed,
                };
                if (req.user.hasAuth) {
                    const workgroup = await this.getWorkgroupInfo(
                        req.user,
                    );
                    response.hasWorkgroup = !!(workgroup.namespaces || [])
                        .find((w) => w.role === 'owner');
                } else {
                    // Basic auth workgroup condition
                    response.hasWorkgroup = !!(await this.getAllWorkgroups(req.user.username)).length;
                }
                res.json(response);
            } catch (err) {
                surfaceProfileControllerErrors({
                    res,
                    msg: 'Unable to contact Profile Controller',
                    err,
                });
            }
        })
        .post('/create', async (req: Request, res: Response) => {
            const profile = req.body as CreateProfileRequest;
            try {
                const namespace = profile.namespace || req.user.username;
                // Use the request body if provided, fallback to auth headers
                await this.profilesService.createProfile({
                    metadata: {
                        name: namespace,
                    },
                    spec: {
                        owner: {
                            kind: 'User',
                            name: profile.user || req.user.email,
                        }
                    },
                });
                res.json({message: `Created namespace ${namespace}`});
            } catch (err) {
                surfaceProfileControllerErrors({
                    res,
                    msg: 'Unexpected error creating profile',
                    err,
                });
            }
        })
        .get('/env-info', async (req: Request, res: Response) => {
            try {
                if (req.user.hasAuth) {
                    return res.json(await this.getProfileAwareEnv(req.user));
                }
                res.json(await this.getBasicEnvironment(req.user));
            } catch (err) {
                const code = (err.response && err.response.statusCode) || 400;
                const error = err.body || 'Unexpected error getting environment info';
                console.log(`Unable to get environment info: ${error}${err.stack?'\n'+err.stack:''}`);
                apiError({res, code, error});
            }
        })
        .use((req: Request, res: Response, next: NextFunction) => {
            if (!req.user.hasAuth) {
                return apiError({
                    res,
                    code: 405,
                    error: 'Unable to ascertain user identity from request, cannot access route.',
                });
            }
            next();
        })
        .delete('/nuke-self', async (req: Request, res: Response) => {
            try {
                const headers = req.user.auth;
                const namespace = req.user.username;
                const {body: serverBody} = await this.profilesService.deleteProfile(namespace, {headers});
                res.json({message: `Removed namespace/profile ${namespace}`, serverBody});
            } catch (err) {
                surfaceProfileControllerErrors({
                    res,
                    msg: 'Unexpected error deleting profile',
                    err,
                });
            }
        })
        .get('/get-all-namespaces', async (req: Request, res: Response) => {
            try {
                const {body} = await this.profilesService.readBindings();
                // tslint:disable-next-line: no-any
                const namespaces = {} as any;
                const bindings = mapWorkgroupBindingToSimpleBinding(
                    body.bindings
                );
                bindings.forEach((b) => {
                    const name = b.namespace;
                    if (!namespaces[name]) {namespaces[name] = {contributors: []};}
                    const namespace = namespaces[name];
                    if (b.role === 'owner') {namespace.owner = b.user; return;}
                    namespaces[name].contributors.push(b.user);
                });
                const tabular = Object.keys(namespaces).map(namespace => [
                    namespace,
                    namespaces[namespace].owner,
                    namespaces[namespace].contributors.join(', '),
                ]);
                res.json(tabular);
            } catch (err) {
                surfaceProfileControllerErrors({
                    res,
                    msg: `Unable to fetch all workgroup data`,
                    err,
                });
            }
        })
        .get('/get-contributors/:namespace', async (req: Request, res: Response) => {
            const {namespace} = req.params;
            try {
                const users = await this.getContributors(namespace);
                res.json(users);
            } catch (err) {
                surfaceProfileControllerErrors({
                    res,
                    msg: `Unable to fetch contributors for ${namespace}`,
                    err,
                });
            }
        })
        .post('/add-contributor/:namespace', async (req: Request, res: Response) => {
            this.handleContributor('create', req, res);
        })
        .delete('/remove-contributor/:namespace', async (req: Request, res: Response) => {
            this.handleContributor('remove', req, res);
        });
    }
}

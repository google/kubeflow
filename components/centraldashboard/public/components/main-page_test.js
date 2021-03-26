import '@polymer/test-fixture/test-fixture';
import 'jasmine-ajax';
import {flush} from '@polymer/polymer/lib/utils/flush.js';

import './main-page';
import {mockRequest} from '../ajax_test_helper';

const FIXTURE_ID = 'main-page-fixture';
const MAIN_PAGE_SELECTOR_ID = 'test-main-page';
const TEMPLATE = `
<test-fixture id="${FIXTURE_ID}">
  <template>
    <main-page id="${MAIN_PAGE_SELECTOR_ID}"></main-page>
  </template>
</test-fixture>
`;

const MENU_LINKS = [
    {
        link: '/jupyter/',
        text: 'Notebooks',
    },
    {
        link: '/pipeline/#/pipelines',
        text: 'Pipelines',
    },
    {
        link: '/katib/trials',
        text: 'Katib Trials',
    },
    {
        type: 'section',
        text: 'Experiments',
        items: [
            {
                link: '/pipeline/#/experiments',
                text: 'Pipelines',
            },
            {
                link: '/katib/experiments',
                text: 'Katib Experiments',
            },
        ],
    },
    {
        link: '/pipeline/#/runs',
        text: 'Runs',
    },
];

describe('Main Page', () => {
    let mainPage;
    let beforeHash;

    beforeAll(() => {
        jasmine.Ajax.install();
        const div = document.createElement('div');
        div.innerHTML = TEMPLATE;
        document.body.appendChild(div);
    });

    beforeEach(() => {
        beforeHash = window.location.hash;
        document.getElementById(FIXTURE_ID).create();
        mainPage = document.getElementById(MAIN_PAGE_SELECTOR_ID);
    });

    afterEach(() => {
        mainPage.set('queryParams.ns', null);
        mainPage.set('queryParams.foo', null);
        document.getElementById(FIXTURE_ID).restore();
        window.location.hash = beforeHash;
    });

    afterAll(() => {
        jasmine.Ajax.uninstall();
    });

    it('Sets view state when dashboard page is active', async () => {
        const selectedTabPromise = new Promise((resolve) => {
            const paperTabs = mainPage.shadowRoot.querySelector('paper-tabs');
            paperTabs.addEventListener('selected-item-changed', () => {
                resolve();
            });
        });
        mainPage._routePageChanged('');
        flush();

        expect(mainPage.page).toBe('dashboard');
        expect(mainPage.inIframe).toBe(false);

        await selectedTabPromise;
        expect(mainPage.shadowRoot.querySelector('paper-tab[page="dashboard"]')
            .classList.contains('iron-selected')).toBe(true);
    });

    it('Sets view state when activities page is active', async () => {
        const selectedTabPromise = new Promise((resolve) => {
            const paperTabs = mainPage.shadowRoot.querySelector('paper-tabs');
            paperTabs.addEventListener('selected-item-changed', () => {
                resolve();
            });
        });
        mainPage._routePageChanged('activity');
        flush();

        expect(mainPage.page).toBe('activity');
        expect(mainPage.inIframe).toBe(false);

        await selectedTabPromise;
        expect(mainPage.shadowRoot.querySelector('paper-tab[page="activity"]')
            .classList.contains('iron-selected')).toBe(true);
    });

    it('Sets view state when an invalid page is specified', () => {
        spyOn(mainPage, '_isInsideOfIframe').and.returnValue(false);
        mainPage._routePageChanged('not-a-valid-page');
        flush();

        expect(mainPage.page).toBe('not_found');
        expect(mainPage.notFoundInIframe).toBe(false);
        expect(mainPage.inIframe).toBe(false);
        expect(mainPage.shadowRoot.getElementById('ViewTabs')
            .hasAttribute('hidden')).toBe(true);
    });

    it('Sets view state when iframe page is active', () => {
        spyOn(mainPage.$.MainDrawer, 'close');

        mainPage.set('queryParams.ns', 'test');
        mainPage.subRouteData.path = '/jupyter/';
        mainPage._routePageChanged('_');
        flush();

        expect(window.location.search).toContain('ns=test');
        expect(mainPage.page).toBe('iframe');
        expect(mainPage.inIframe).toBe(true);
        expect(mainPage.shadowRoot.getElementById('ViewTabs')
            .hasAttribute('hidden')).toBe(true);
    });

    it('Sets view state when an invalid page is specified from an iframe',
        () => {
            spyOn(mainPage, '_isInsideOfIframe').and.returnValue(true);
            mainPage._routePageChanged('not-a-valid-page-in-iframe');
            flush();

            expect(mainPage.page).toBe('not_found');
            expect(mainPage.notFoundInIframe).toBe(true);
            expect(mainPage.shadowRoot.getElementById('ViewTabs')
                .hasAttribute('hidden')).toBe(true);
            expect(mainPage.shadowRoot.getElementById('ViewTabs')
                .hasAttribute('hidden')).toBe(true);
        });

    it('Appends query string when building links', () => {
        const sidebarLinkSelector = '#MainDrawer iron-selector iframe-link';
        const headerLinkSelector = '#ViewTabs paper-tabs a';

        // Base case
        const hrefs = [];
        mainPage.shadowRoot.querySelectorAll(sidebarLinkSelector)
            .forEach((l) => hrefs.push(l.href));
        mainPage.shadowRoot.querySelectorAll(headerLinkSelector)
            .forEach((l) => hrefs.push(l.href));
        hrefs.forEach((h) => expect(h).not.toContain('?'));

        // Set namespace case
        mainPage.namespace = 'another-namespace';
        flush();
        hrefs.splice(0);
        mainPage.shadowRoot.querySelectorAll(sidebarLinkSelector)
            .forEach((l) => hrefs.push(l.href));
        mainPage.shadowRoot.querySelectorAll(headerLinkSelector)
            .forEach((l) => hrefs.push(l.href));
        hrefs.forEach((h) => expect(h).toContain('?ns=another-namespace'));
    });

    it('Sets information when platform info is received', async () => {
        const namespaces = [
            {
                user: 'testuser',
                namespace: 'default',
                role: 'editor',
            },
            {
                user: 'testuser',
                namespace: 'kubeflow',
                role: 'editor',
            },
            {
                user: 'testuser',
                namespace: 'namespace-2',
                role: 'editor',
            },
        ];
        const user = 'anonymous@kubeflow.org';
        const envInfo = {
            namespaces,
            user,
            platform: {
                provider: 'gce://test-project/us-east1-c/gke-kubeflow-node-123',
                providerName: 'gce',
                kubeflowVersion: '1.0.0',
            },
            isClusterAdmin: false,
        };
        const hasWorkgroup = {
            user,
            hasWorkgroup: false,
            hasAuth: false,
            registrationFlowAllowed: true,
        };
        const getHasWorkgroup = mockRequest(mainPage, {
            status: 200,
            responseText: JSON.stringify(hasWorkgroup),
        }, false, '/api/workgroup/exists');
        const getEnvInfo = mockRequest(mainPage, {
            status: 200,
            responseText: JSON.stringify(envInfo),
        }, false, '/api/workgroup/env-info');
        await Promise.all([getHasWorkgroup, getEnvInfo]);
        flush();

        const buildVersion = mainPage.shadowRoot.querySelector(
            'section.build span');
        // textContent is used because innerText would be empty if sidebar is
        // hidden
        expect(buildVersion.textContent).toEqual('1.0.0');
        const namespaceSelector = mainPage.shadowRoot
            .getElementById('NamespaceSelector');
        expect(Array.from(namespaceSelector.shadowRoot
            .querySelectorAll('paper-item'))
            .map((n) => n.innerText.trim()))
            .toEqual(['default', 'kubeflow', 'namespace-2']);
    });

    it('Pushes to history when iframe page changes', () => {
        const historySpy = spyOn(window.history, 'replaceState');
        mainPage.iframePage = '/notebooks?blah=bar';
        mainPage.iframePage = '/pipelines/create/new';
        const l1 = new URL('/_/notebooks?blah=bar',
            window.location.origin).toString();
        expect(historySpy).toHaveBeenCalledWith(null, null, l1);
        const l2 = new URL('/_/pipelines/create/new',
            window.location.origin).toString();
        expect(historySpy).toHaveBeenCalledWith(null, null, l2);
    });

    it('Sets iframeSrc with hash and query values from parent', () => {
        const hash = '#/hash/route/fragments';
        window.location.hash = hash;
        mainPage.set('queryParams.ns', 'test');
        mainPage.set('queryParams.foo', 'bar');
        mainPage.subRouteData.path = '/pipeline/';
        mainPage._routePageChanged('_');
        flush();

        expect(mainPage.iframeSrc).toMatch(
            new RegExp(`${window.location.origin}/pipeline/?.*foo=bar${hash}`));
    });

    it('Sets iframeSrc to about:blank when user navigates to non-iframe page',
        () => {
            mainPage.subRouteData.path = '/pipeline/';
            mainPage._routePageChanged('_');
            flush();

            expect(mainPage.iframeSrc).toMatch(
                new RegExp(`${window.location.origin}/pipeline/`));

            mainPage.subRouteData.path = '';
            mainPage._routePageChanged('activity');
            flush();

            expect(mainPage.iframeSrc).toBe('about:blank');
        });

    function getSelectedMenuItem() {
        return mainPage.shadowRoot.querySelectorAll(
            '.menu-item.iron-selected');
    }

    it('Sets active menu item from simple URL',
        () => {
            mainPage.menuLinks = MENU_LINKS;
            flush();
            mainPage._setActiveMenuLink('/jupyter/', '');
            flush();
            const activeMenuItem = getSelectedMenuItem();
            expect(activeMenuItem.length).toBe(1);
            expect(activeMenuItem[0].parentElement.href).toBe('/jupyter/');
        });

    it('Sets active menu item from hash-based URL with common prefix',
        () => {
            mainPage.menuLinks = MENU_LINKS;
            flush();
            mainPage._setActiveMenuLink('/pipeline/',
                '/experiments/details/12345');
            flush();
            let activeMenuItem = getSelectedMenuItem();
            expect(activeMenuItem.length).toBe(1);
            expect(activeMenuItem[0].parentElement.href).toBe(
                '/pipeline/#/experiments');

            mainPage._setActiveMenuLink('/pipeline/',
                '/runs/details/12345');
            flush();
            activeMenuItem = getSelectedMenuItem();
            expect(activeMenuItem.length).toBe(1);
            expect(activeMenuItem[0].parentElement.href).toBe(
                '/pipeline/#/runs');
        });

    it('Sets active menu item from path-based URL with common prefix ',
        () => {
            mainPage.menuLinks = MENU_LINKS;
            flush();
            mainPage._setActiveMenuLink('/katib/experiments/id/12345', '');
            flush();
            let activeMenuItem = getSelectedMenuItem();
            expect(activeMenuItem.length).toBe(1);
            expect(activeMenuItem[0].parentElement.href).toBe(
                '/katib/experiments');

            mainPage._setActiveMenuLink('/katib/trials/id/12345', '');
            flush();
            activeMenuItem = getSelectedMenuItem();
            expect(activeMenuItem.length).toBe(1);
            expect(activeMenuItem[0].parentElement.href).toBe('/katib/trials');
        });
});

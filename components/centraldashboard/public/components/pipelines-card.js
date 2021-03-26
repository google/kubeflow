import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-item/paper-icon-item.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-progress/paper-progress.js';
import './iframe-link.js';

import {html, PolymerElement} from '@polymer/polymer';

import './card-styles.js';
import utilitiesMixin from './utilities-mixin.js';

const MAX_PIPELINES = 5;
const PIPELINES = 'pipelines';
const RUNS = 'runs';
const VALID_ARTIFACT_TYPES = new Set([PIPELINES, RUNS]);

/**
 * Component to retrieve and display Pipelines or Pipeline Runs
 */
export class PipelinesCard extends utilitiesMixin(PolymerElement) {
    static get template() {
        return html`
        <style include="card-styles">
            :host {
                @apply --layout-vertical;
            }
            iron-icon.success {
                color: rgb(52, 168, 83);
            }
            iron-icon.error {
                color: rgb(213, 0, 0);
            }
        </style>
        <iron-ajax auto url="[[listPipelinesUrl]]" handle-as="json"
            loading="{{loading}}" on-response="_onResponse" on-error="_onError">
        </iron-ajax>
        <paper-progress indeterminate class="slow"
            hidden$="[[!loading]]"></paper-progress>
        <paper-card heading="[[heading]]">
            <header id="message" hidden$="[[!message]]">[[message]]</header>
            <template is="dom-repeat" items="[[pipelines]]">
                <iframe-link class="link" href$="[[item.href]]">
                    <paper-icon-item>
                        <paper-ripple></paper-ripple>
                        <iron-icon icon="[[item.icon]]" slot="item-icon"
                            class$="[[item.iconClass]]"
                            title="[[item.iconTitle]]">
                        </iron-icon>
                        <paper-item-body two-line>
                            <div class="header">[[item.name]]</div>
                            <aside secondary>Created [[item.created]]</aside>
                        </paper-item-body>
                    </paper-icon-item>
                </iframe-link>
            </template>
        </paper-card>
        `;
    }

    static get properties() {
        return {
            loading: {
                type: Boolean,
                value: false,
            },
            heading: String,
            artifactType: String,
            namespace: {
                type: String,
                observer: '_namespaceChange',
            },
            message: {
                type: String,
                value: '',
            },
            listPipelinesUrl: {
                type: String,
                computed: '_getListPipelinesUrl(artifactType, namespace)',
            },
            pipelines: {
                type: Array,
                value: () => [],
            },
        };
    }

    /**
     * Returns the URL to list the available Pipeline artifacts
     * @param {string} artifactType
     * @param {string} namespace
     * @return {string}
     */
    _getListPipelinesUrl(artifactType, namespace) {
        if (!VALID_ARTIFACT_TYPES.has(artifactType)) return null;
        let link = `/pipeline/apis/v1beta1/${artifactType}?`
            + 'page_size=5&sort_by=created_at%20desc';
        if (artifactType === RUNS) {
            link += '&resource_reference_key.type=NAMESPACE'
            + `&resource_reference_key.id=${namespace}`;
        }
        return link;
    }

    /**
     * Handles the response from the Pipelines API to set the items that
     * will displayed in the card.
     * @param {Event} responseEvent
     */
    _onResponse(responseEvent) {
        const response = responseEvent.detail.response;
        const artifacts = response[this.artifactType] || [];
        const pipelines = artifacts.map((p) => {
            const date = new Date(p.created_at);
            const iconTitle = p.status || '';
            let icon = 'kubeflow:pipeline';
            let iconClass = '';
            if (this.artifactType === RUNS) {
                switch (p.status) {
                case 'Succeeded':
                    icon = 'icons:check-circle';
                    iconClass = 'success';
                    break;
                case 'Error':
                case 'Failed':
                    icon = 'icons:error';
                    iconClass = 'error';
                    break;
                default:
                    icon = 'icons:schedule';
                }
            }
            return {
                created: date.toLocaleString(),
                href: this.buildHref(
                    `/pipeline/#/${this.artifactType}/details/${p.id}`,
                    {ns: this.namespace}
                ),
                name: p.name,
                icon,
                iconClass,
                iconTitle,
            };
        }).slice(0, MAX_PIPELINES);
        this.splice('pipelines', 0, this.pipelines.length, ...pipelines);
        this.message = this.pipelines.length ? '' : 'None Found';
        this.loading = false;
    }

    /**
     * Handles an Pipelines error response.
     */
    _onError() {
        this.splice('pipelines', 0);
        this.message = this.artifactType === PIPELINES ?
            'Error retrieving Pipelines' : 'Error retrieving Pipeline Runs';
    }

    /**
     * Rewrites the links adding the namespace as a query parameter.
     * @param {namesapce} namespace
     */
    _namespaceChange(namespace) {
        const pipelines = this.pipelines.map((p) => {
            p.href = this.buildHref(p.href, {ns: namespace});
            return p;
        });
        // We need to deep-copy and re-assign in order to trigger the
        // re-rendering of the component
        this.pipelines = JSON.parse(JSON.stringify(pipelines));
    }
}

customElements.define('pipelines-card', PipelinesCard);

import "@goauthentik/admin/blueprints/BlueprintForm";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config.js";
import { EVENT_REFRESH } from "@goauthentik/common/constants.js";
import { uiConfig } from "@goauthentik/common/ui/config.js";
import "@goauthentik/elements/ak-status-label.js";
import "@goauthentik/elements/buttons/ActionButton/ak-action-button.js";
import "@goauthentik/elements/buttons/SpinnerButton/ak-spinner-button.js";
import "@goauthentik/elements/forms/DeleteBulkForm.js";
import "@goauthentik/elements/forms/ModalForm.js";
import "@goauthentik/elements/rbac/ObjectPermissionModal.js";
import { PaginatedResponse } from "@goauthentik/elements/table/Table.js";
import { TableColumn } from "@goauthentik/elements/table/Table.js";
import { TablePage } from "@goauthentik/elements/table/TablePage.js";
import "@patternfly/elements/pf-tooltip/pf-tooltip.js";

import { msg } from "@lit/localize";
import { CSSResult, TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import PFDescriptionList from "@patternfly/patternfly/components/DescriptionList/description-list.css";

import {
    BlueprintInstance,
    BlueprintInstanceStatusEnum,
    ManagedApi,
    RbacPermissionsAssignedByUsersListModelEnum,
} from "@goauthentik/api";

export function BlueprintStatus(blueprint?: BlueprintInstance): string {
    if (!blueprint) return "";
    switch (blueprint.status) {
        case BlueprintInstanceStatusEnum.Successful:
            return msg("Successful");
        case BlueprintInstanceStatusEnum.Orphaned:
            return msg("Orphaned");
        case BlueprintInstanceStatusEnum.Warning:
            return msg("Warning");
        case BlueprintInstanceStatusEnum.Error:
            return msg("Error");
    }
    return msg("Unknown");
}

@customElement("ak-blueprint-list")
export class BlueprintListPage extends TablePage<BlueprintInstance> {
    searchEnabled(): boolean {
        return true;
    }
    pageTitle(): string {
        return msg("Blueprints");
    }
    pageDescription(): string {
        return msg("Automate and template configuration within authentik.");
    }
    pageIcon(): string {
        return "pf-icon pf-icon-blueprint";
    }

    expandable = true;
    checkbox = true;

    @property()
    order = "name";

    static get styles(): CSSResult[] {
        return super.styles.concat(PFDescriptionList);
    }

    async apiEndpoint(page: number): Promise<PaginatedResponse<BlueprintInstance>> {
        return new ManagedApi(DEFAULT_CONFIG).managedBlueprintsList({
            ordering: this.order,
            page: page,
            pageSize: (await uiConfig()).pagination.perPage,
            search: this.search || "",
        });
    }

    columns(): TableColumn[] {
        return [
            new TableColumn(msg("Name"), "name"),
            new TableColumn(msg("Status"), "status"),
            new TableColumn(msg("Last applied"), "last_applied"),
            new TableColumn(msg("Enabled"), "enabled"),
            new TableColumn(msg("Actions")),
        ];
    }

    renderToolbarSelected(): TemplateResult {
        const disabled = this.selectedElements.length < 1;
        return html`<ak-forms-delete-bulk
            objectLabel=${msg("Blueprint(s)")}
            .objects=${this.selectedElements}
            .metadata=${(item: BlueprintInstance) => {
                return [{ key: msg("Name"), value: item.name }];
            }}
            .usedBy=${(item: BlueprintInstance) => {
                return new ManagedApi(DEFAULT_CONFIG).managedBlueprintsUsedByList({
                    instanceUuid: item.pk,
                });
            }}
            .delete=${(item: BlueprintInstance) => {
                return new ManagedApi(DEFAULT_CONFIG).managedBlueprintsDestroy({
                    instanceUuid: item.pk,
                });
            }}
        >
            <button ?disabled=${disabled} slot="trigger" class="pf-c-button pf-m-danger">
                ${msg("Delete")}
            </button>
        </ak-forms-delete-bulk>`;
    }

    renderExpanded(item: BlueprintInstance): TemplateResult {
        return html`<td role="cell" colspan="4">
            <div class="pf-c-table__expandable-row-content">
                <dl class="pf-c-description-list pf-m-horizontal">
                    <div class="pf-c-description-list__group">
                        <dt class="pf-c-description-list__term">
                            <span class="pf-c-description-list__text">${msg("Path")}</span>
                        </dt>
                        <dd class="pf-c-description-list__description">
                            <div class="pf-c-description-list__text">
                                <pre>${item.path}</pre>
                            </div>
                        </dd>
                    </div>
                </dl>
            </div>
        </td>`;
    }

    row(item: BlueprintInstance): TemplateResult[] {
        let description = undefined;
        const descKey = "blueprints.goauthentik.io/description";
        if (
            item.metadata &&
            item.metadata.labels &&
            Object.hasOwn(item.metadata?.labels, descKey)
        ) {
            description = item.metadata?.labels[descKey];
        }
        return [
            html`<div>${item.name}</div>
                ${description ? html`<small>${description}</small>` : html``}`,
            html`${BlueprintStatus(item)}`,
            html`${item.lastApplied.toLocaleString()}`,
            html`<ak-status-label ?good=${item.enabled}></ak-status-label>`,
            html`<ak-forms-modal>
                    <span slot="submit"> ${msg("Update")} </span>
                    <span slot="header"> ${msg("Update Blueprint")} </span>
                    <ak-blueprint-form slot="form" .instancePk=${item.pk}> </ak-blueprint-form>
                    <button slot="trigger" class="pf-c-button pf-m-plain">
                        <pf-tooltip position="top" content=${msg("Edit")}>
                            <i class="fas fa-edit"></i>
                        </pf-tooltip>
                    </button>
                </ak-forms-modal>
                <ak-rbac-object-permission-modal
                    model=${RbacPermissionsAssignedByUsersListModelEnum.BlueprintsBlueprintinstance}
                    objectPk=${item.pk}
                >
                </ak-rbac-object-permission-modal>
                <ak-action-button
                    class="pf-m-plain"
                    .apiRequest=${() => {
                        return new ManagedApi(DEFAULT_CONFIG)
                            .managedBlueprintsApplyCreate({
                                instanceUuid: item.pk,
                            })
                            .then(() => {
                                this.dispatchEvent(
                                    new CustomEvent(EVENT_REFRESH, {
                                        bubbles: true,
                                        composed: true,
                                    }),
                                );
                            });
                    }}
                >
                    <pf-tooltip position="top" content=${msg("Apply")}>
                        <i class="fas fa-play" aria-hidden="true"></i>
                    </pf-tooltip>
                </ak-action-button>`,
        ];
    }

    renderObjectCreate(): TemplateResult {
        return html`
            <ak-forms-modal>
                <span slot="submit"> ${msg("Create")} </span>
                <span slot="header"> ${msg("Create Blueprint Instance")} </span>
                <ak-blueprint-form slot="form"> </ak-blueprint-form>
                <button slot="trigger" class="pf-c-button pf-m-primary">${msg("Create")}</button>
            </ak-forms-modal>
        `;
    }
}

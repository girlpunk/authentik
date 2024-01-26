import { DEFAULT_CONFIG } from "@goauthentik/common/api/config.js";
import { EventWithContext } from "@goauthentik/common/events.js";
import { actionToLabel } from "@goauthentik/common/labels.js";
import { uiConfig } from "@goauthentik/common/ui/config.js";
import "@goauthentik/components/ak-event-info.js";
import "@goauthentik/elements/Tabs.js";
import "@goauthentik/elements/buttons/Dropdown.js";
import "@goauthentik/elements/buttons/ModalButton.js";
import "@goauthentik/elements/buttons/SpinnerButton/ak-spinner-button.js";
import { PaginatedResponse, Table, TableColumn } from "@goauthentik/elements/table/Table.js";

import { msg, str } from "@lit/localize";
import { TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Event, EventsApi } from "@goauthentik/api";

@customElement("ak-events-user")
export class UserEvents extends Table<Event> {
    expandable = true;

    @property()
    order = "-created";

    @property()
    targetUser!: string;

    async apiEndpoint(page: number): Promise<PaginatedResponse<Event>> {
        return new EventsApi(DEFAULT_CONFIG).eventsEventsList({
            page: page,
            ordering: this.order,
            pageSize: (await uiConfig()).pagination.perPage,
            username: this.targetUser,
        });
    }

    columns(): TableColumn[] {
        return [
            new TableColumn(msg("Action"), "action"),
            new TableColumn(msg("User"), "enabled"),
            new TableColumn(msg("Creation Date"), "created"),
            new TableColumn(msg("Client IP"), "client_ip"),
        ];
    }

    row(item: EventWithContext): TemplateResult[] {
        return [
            html`${actionToLabel(item.action)}`,
            html`<div>${item.user?.username}</div>
                ${item.user.on_behalf_of
                    ? html`<small>
                          ${msg(str`On behalf of ${item.user.on_behalf_of.username}`)}
                      </small>`
                    : html``}`,
            html`<span>${item.created?.toLocaleString()}</span>`,
            html`<span>${item.clientIp || msg("-")}</span>`,
        ];
    }

    renderExpanded(item: Event): TemplateResult {
        return html` <td role="cell" colspan="4">
                <div class="pf-c-table__expandable-row-content">
                    <ak-event-info .event=${item as EventWithContext}></ak-event-info>
                </div>
            </td>
            <td></td>
            <td></td>
            <td></td>`;
    }

    renderEmpty(): TemplateResult {
        return super.renderEmpty(
            html`<ak-empty-state header=${msg("No Events found.")}>
                <div slot="body">${msg("No matching events could be found.")}</div>
            </ak-empty-state>`,
        );
    }
}

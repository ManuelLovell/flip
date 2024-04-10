import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { Constants, MetaSettings } from "./utilities/bsConstants";
import * as Utilities from './utilities/bsUtilities';
import { MirrorItem } from "./interfaces/flip";
import { BSCACHE } from "./utilities/bsSceneCache";

export async function SetupFlipButton(): Promise<void>
{
    if (BSCACHE.playerRole === "PLAYER" && Utilities.Reta(MetaSettings.DISABLEBIND)) return;

    //SETUP CODENAME:FLOP BUTTON
    await OBR.contextMenu.create({
        id: Constants.CONTEXTFLOPID,
        icons: [
            {
                icon: "/flop.svg",
                label: "Flip It!",
                filter: {
                    every: [
                        // This is for Bound characters, it swaps to their other side
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined, operator: "!=", coordinator: "&&" },
                        { key: "image", value: undefined, operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "GRID", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "RULER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "FOG", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POINTER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "CONTROL", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POPOVER", operator: "!=", coordinator: "&&" },
                    ],
                },
            },
        ],
        async onClick(context, _: string)
        {
            // Find bound floppies, grab the metadata of this one to find it's Mirror
            let showThese: Item[] = [];
            let hideThese: Item[] = [];
            let updateThese: Image[] = [];

            // Deselect so we don't see the selection halo
            await OBR.player.deselect(context.items.map(item => item.id));
            const attached = await OBR.scene.items.getItemAttachments(context.items.map(x => x.id));
            const attachedItems = attached.filter(item => !context.items.find(x => x.id == item.id));
            const existingItems = (await OBR.scene.items.getItems()).map(x => x.id);

            // Get the mirrored items data and clean it up
            for (let cItem of context.items)
            {
                const item = cItem as Image;
                const mirrorImage = JSON.parse(item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as string) as MirrorItem;

                // Check for ID conflicts from duplicates
                const updateId = existingItems.includes(mirrorImage.id);
                const newId = updateId ? Utilities.GetGUID() : undefined;
                if (newId) mirrorImage.id = newId;

                if (BSCACHE.KEEPATTACHMENTS)
                {
                    // Remove
                    const attachments = (await OBR.scene.items.getItemAttachments([cItem.id]))?.filter(x => x.id !== cItem.id);
                    if (attachments?.length > 0)
                    {
                        cItem.metadata[`${Constants.EXTENSIONID}/metadata_bind_attachments`] = JSON.stringify(attachments);
                        hideThese = hideThese.concat(attachments);
                    }
                    // Make visible
                    const mirrorAttachments = mirrorImage.metadata[`${Constants.EXTENSIONID}/metadata_bind_attachments`] as string;
                    if (mirrorAttachments)
                    {
                        // Have to account for the parent moving
                        const xAdjustment = item.position.x - mirrorImage.position.x;
                        const yAdjustment = item.position.y - mirrorImage.position.y;

                        const parsedAttach = JSON.parse(mirrorAttachments) as MirrorItem[];
                        for (const attach of parsedAttach)
                        {
                            attach.position.x += xAdjustment;
                            attach.position.y += yAdjustment;
                            if (newId) 
                            {
                                attach.id = Utilities.GetGUID();
                                attach.attachedTo = newId;
                            }
                        }
                        showThese = showThese.concat(parsedAttach);
                    }
                }
                else
                {
                    for (let attachee of attachedItems)
                    {

                        const oldParent = context.items.find((item) => item.id === attachee.attachedTo);
                        if (oldParent)
                        {
                            const copyAttach = { ...attachee };
                            copyAttach.attachedTo = newId ? newId : mirrorImage.id;
                            if (newId) copyAttach.id = Utilities.GetGUID();
                            updateThese.push(copyAttach as Image);
                        }
                    }
                }

                mirrorImage.position.x = item.position.x;
                mirrorImage.position.y = item.position.y;
                item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;
                mirrorImage.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = JSON.stringify(item);
                showThese.push(mirrorImage);
                hideThese.push(cItem);
            }

            // This order matters, or else attachments won't have the new item to move to
            await OBR.scene.items.addItems(showThese);

            if (!BSCACHE.KEEPATTACHMENTS)
            {
                await OBR.scene.items.updateItems(attachedItems,
                    (items) =>
                    {
                        for (let item of items)
                        {
                            const updatedItem = updateThese.find(x => x.id === item.id);
                            if (updatedItem)
                            {
                                item.attachedTo = updatedItem.attachedTo;
                            }
                        }
                    });
            }

            await OBR.scene.items.deleteItems(hideThese.map(x => x.id));

            // Select the new guy(s)
            const selectedId = showThese.map(item => item.id);
            await OBR.player.select(selectedId);
        }
    });
}

export async function SetupReverseButton(): Promise<void>
{
    // SETUP FLIP BUTTON
    await OBR.contextMenu.create({
        id: Constants.CONTEXTFLIPID,
        icons: [
            {
                icon: "/flip.svg",
                label: "Reverse It",
                filter: {
                    every: [
                        { key: "image", value: undefined, operator: "!=" },
                    ],
                }
            }
        ],
        async onClick(context, _: string)
        {
            await OBR.scene.items.updateItems(context.items, (items) =>
            {
                for (let item of items)
                {
                    item.scale.x = -(item.scale.x);
                }
            });
        }
    });
}

export async function SetupBindButton(): Promise<void>
{
    if (BSCACHE.playerRole === "PLAYER" && Utilities.Reta(MetaSettings.DISABLEBIND)) return;

    // Setup our BIND buttons
    await OBR.contextMenu.create({
        id: Constants.CONTEXTBINDID,
        icons: [
            {
                icon: "/combine.svg",
                label: "Bind It",
                filter: {
                    min: 2,
                    max: 2,
                    every: [
                        // Only work on a pair at a time, with no bind metadata
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined, coordinator: "&&" },
                        { key: "image", value: undefined, operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "GRID", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "RULER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "FOG", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POINTER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "CONTROL", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POPOVER", operator: "!=", coordinator: "&&" },
                    ],
                },
            },
            {
                icon: "/split.svg",
                label: "Un-Bind It",
                filter: {
                    max: 1,
                    every: [
                        // Only unbind a set at a time, who has bind metadata
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined, operator: "!=", coordinator: "&&" },
                        { key: "image", value: undefined, operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "GRID", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "RULER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "FOG", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POINTER", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "CONTROL", operator: "!=", coordinator: "&&" },
                        { key: "layer", value: "POPOVER", operator: "!=", coordinator: "&&" },
                    ],
                },
            }
        ],
        async onClick(context, _: string)
        {
            if (context.items.length == 1)
            {
                // If it's one, this is an unbind
                const item = context.items[0] as Image;

                // Get the mirrored items data and clean it up
                const mirrorImage = JSON.parse(item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as string) as Image;
                mirrorImage.position.x = item.position.x + (item.image.width / 2);
                mirrorImage.position.y = item.position.y + (item.image.height / 4);
                mirrorImage.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;

                // Clear the bind metadata off so it's fresh
                await OBR.scene.items.updateItems(
                    (original) => original.id === item.id,
                    (items) =>
                    {
                        for (let itemed of items)
                        {
                            itemed.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;
                        }
                    });

                // Re-Insert the old one
                await OBR.scene.items.addItems([mirrorImage]);
            }
            else
            {
                const sameType = context.items.every(x => x.layer === context.items[0].layer);

                if (!sameType)
                {
                    await OBR.notification.show("Bound items must be from the same Layer.", "WARNING");
                    return;
                }

                const first = context.items[0] as Image;
                const second = context.items[1] as Image;

                // If it's not a single, we're binding
                await OBR.scene.items.updateItems([context.items[0]], (items) =>
                {
                    for (let i = 0; i < items.length; i++)
                    {
                        items[i].metadata[`${Constants.EXTENSIONID}/metadata_bind`] = JSON.stringify(second);
                    }
                });

                await OBR.scene.items.deleteItems([second.id])
                // Select the first of the array since we hid the other guy
                await OBR.player.select([first.id]);
            }
        },
    });
}
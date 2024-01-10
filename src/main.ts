import OBR, { Image, Item } from '@owlbear-rodeo/sdk'
import { Constants } from './constants';
import * as Utilities from './utilities';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div style="display:flex;"><div id="bannerText"></div><div id="whatsNew"></div></div>
    <h4>Disable Z-Ordering:<input type="checkbox" id="disableZOrder"></h4>
    <h4>Disable Binding for Players:<input type="checkbox" id="disableBinding"></h4>
    <h4>Keep Attachments with Parent:<input type="checkbox" id="keepAttachments"></h4>
  </div>
`
///Scrolling News
const textArray = [
    "Fixed Bug with Names Showing",
    "Flip! v1.2",
    "New Attachment Permission",];

let currentIndex = 0;
let bindingDisabled = false;
const textContainer = document.getElementById("bannerText")!;
const zCheckbox = document.getElementById("disableZOrder")! as HTMLInputElement;
const bindCheckbox = document.getElementById("disableBinding")! as HTMLInputElement;
const attachmentCheckbox = document.getElementById("keepAttachments")! as HTMLInputElement;

const whatsNewContainer = document.getElementById("whatsNew")!;
whatsNewContainer.appendChild(Utilities.GetWhatsNewButton());

function fadeOut()
{
    textContainer.style.opacity = "0";
    setTimeout(() =>
    {
        fadeIn();
    }, 2000); // Fade-out time is 2 seconds
}

function fadeIn()
{
    currentIndex = (currentIndex + 1) % textArray.length;
    textContainer.textContent = textArray[currentIndex];
    textContainer.style.opacity = "1";
    setTimeout(() =>
    {
        fadeOut();
    }, 10000); // Fade-in time is 2 seconds
}
textContainer.textContent = textArray[currentIndex];
fadeIn();

OBR.onReady(async () =>
{
    // Set theme accordingly
    const theme = await OBR.theme.getTheme();
    const roomData = await OBR.room.getMetadata();

    Utilities.SetThemeMode(theme, document);
    OBR.theme.onChange((theme) =>
    {
        Utilities.SetThemeMode(theme, document);
    })

    const role = await OBR.player.getRole();
    // Do all setup through the GM role so we don't have multiple updates
    if (role == "GM")
    {
        bindCheckbox.checked = roomData[`${Constants.EXTENSIONID}/disableBinding`] == true ? true : false;
        zCheckbox.checked = roomData[`${Constants.EXTENSIONID}/disableZIndex`] == true ? true : false;
        attachmentCheckbox.checked = roomData[`${Constants.EXTENSIONID}/attachmentParent`] == true ? true : false;
        const sceneIsReady = await OBR.scene.isReady();
        if (sceneIsReady)
        {
            // If the scene is ready, let's go.
            await SetupFlip();
        }
        // Otherwise wait for the ready, and handle scene changes.
        await OBR.scene.onReadyChange(async (ready) =>
        {
            if (ready)
            {
                // If the scene is ready, let's go.
                await SetupFlip();
            }
            else
            {
                //Guess we'll just wait.
            }
        });
    }
    else
    {
        await OBR.action.setHeight(50);
        document.querySelector<HTMLDivElement>('#app')!.innerHTML = `Configuration is GM-Access only.`;
        OBR.room.onMetadataChange(async (metadata) =>
        {
            bindingDisabled = metadata[`${Constants.EXTENSIONID}/disableBinding`] as boolean;
            if (bindingDisabled)
            {
                await OBR.contextMenu.remove(Constants.CONTEXTBINDID);
            }
            if (bindingDisabled === false)
            {
                await SetupBindButton();
            }
        });
    }

    // We can setup our contextmenu anytime
    // SETUP FLIP BUTTON
    await OBR.contextMenu.create({
        id: Constants.CONTEXTFLIPID,
        icons: [
            {
                icon: "/flip.svg",
                label: "Flip It",
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

    //SETUP CODENAME:FLOP BUTTON
    await OBR.contextMenu.create({
        id: Constants.CONTEXTFLOPID,
        icons: [
            {
                icon: "/flop.svg",
                label: "Flip It!!",
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

            // Get the mirrored items data and clean it up
            for (let cItem of context.items)
            {
                const item = cItem as Image;
                const mirrorImage = JSON.parse(item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as string) as Item;

                if (attachmentCheckbox.checked)
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

                        const parsedAttach = JSON.parse(mirrorAttachments) as Item[];
                        for (const attach of parsedAttach)
                        {
                            attach.position.x += xAdjustment;
                            attach.position.y += yAdjustment;
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
                            copyAttach.attachedTo = mirrorImage.id;
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

            if (!attachmentCheckbox.checked)
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

    async function SetupBindButton(): Promise<void>
    {
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
                    label: "UnBind It",
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

    await SetupBindButton();
    // Do our scene setup which gives everyone a base anchor for Z-axis ordering
    async function SetupFlip(): Promise<void>
    {
        zCheckbox.addEventListener("click", async (event: MouseEvent) =>
        {
            const target = event.target as HTMLInputElement;
            await OBR.room.setMetadata({ [`${Constants.EXTENSIONID}/disableZIndex`]: target.checked });
        }, false);

        bindCheckbox.addEventListener("click", async (event: MouseEvent) =>
        {
            const target = event.target as HTMLInputElement;
            await OBR.room.setMetadata({ [`${Constants.EXTENSIONID}/disableBinding`]: target.checked });
        }, false);

        attachmentCheckbox.addEventListener("click", async (event: MouseEvent) =>
        {
            const target = event.target as HTMLInputElement;
            await OBR.room.setMetadata({ [`${Constants.EXTENSIONID}/attachmentParent`]: target.checked });
        }, false);

        await OBR.scene.items.onChange(async (itemsChanged) =>
        {
            await OBR.scene.items.updateItems(itemsChanged, (items) =>
            {
                if (!zCheckbox.checked)
                {
                    for (let item of items)
                    {
                        // We're only dealing with Image data, so if it's not an image go away
                        if (item.type !== "IMAGE") continue;
                        // To give us a decent range to play in we multiply the position by alot and then work with the height
                        const anchor = (item.position.y * 1000) + (item.image.height / 6);
                        if ((item.zIndex !== anchor
                            && item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] !== undefined)
                            || item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] === undefined)
                        {
                            item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] = { anchor };
                            item.zIndex = anchor;
                        }
                    }
                }
            });
        });

        // Whenever things move around we want to update that Z index.
        await OBR.scene.items.updateItems(
            (item) => item.layer === "CHARACTER" || item.layer === "MOUNT",
            (items) =>
            {
                UpdateZIndex(items);
            });
    }

    // .. Update the index.
    async function UpdateZIndex(items: Image[]): Promise<Image[]>
    {
        for (let item of items)
        {
            if (item.type !== "IMAGE") continue;

            if (item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] === undefined)
            {
                const anchor = (item.position.y * 1000) + (item.image.height / 6);
                item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] = { anchor };
            }
            const metadata = item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] as any;
            item.zIndex = metadata.anchor;
        }
        return items;
    }
});
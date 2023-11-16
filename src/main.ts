import OBR, { Image, Metadata } from '@owlbear-rodeo/sdk'
import { Constants } from './constants';
import * as Utilities from './utilities';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div id="bannerText"></div>
    <h4>Disable Z-Ordering:<input type="checkbox" id="disableZOrder"></h4>
    <h4>Disable Binding for Players:<input type="checkbox" id="disableBinding"></h4>
  </div>
`
///Scrolling News
const textArray = [
    "Flip! v1.1.2",
    "Can now Bind Maps and more!",
    "Added Disable for Z-Ordering",
    "Added Disable for Binding"];

let currentIndex = 0;
let bindingDisabled = false;
const textContainer = document.getElementById("bannerText")!;
const zCheckbox = document.getElementById("disableZOrder")! as HTMLInputElement;
zCheckbox.checked = true;
const bindCheckbox = document.getElementById("disableBinding")! as HTMLInputElement;

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
    Utilities.SetThemeMode(theme, document);
    OBR.theme.onChange((theme) =>
    {
        Utilities.SetThemeMode(theme, document);
    })

    const role = await OBR.player.getRole();
    // Do all setup through the GM role so we don't have multiple updates
    if (role == "GM")
    {
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
            const showThese: Mirror[] = [];

            // Deselect so we don't see the selection halo
            //await OBR.player.deselect(context.items.map(item => item.id)); - BROKEN

            // Hide the one we're selected on
            await OBR.scene.items.updateItems(context.items, (items) =>
            {
                for (let item of items)
                {
                    const metadata: Metadata = item.metadata[`${Constants.EXTENSIONID}/metadata_bind`];
                    const metaMirrored = metadata.mirror as Mirror;

                    let mirrored: Mirror = {
                        id: metaMirrored.id,
                        height: metaMirrored.height,
                        width: metaMirrored.width,
                        x: item.position.x,
                        y: item.position.y
                    };

                    item.image.height = 1;
                    item.image.width = 1;
                    item.position.x = 1;
                    item.position.y = 1;
                    item.disableHit = true;
                    item.locked = true;
                    showThese.push(mirrored);
                }
            });
            // Find the pair and show it based on the mirrored Meta
            await OBR.scene.items.updateItems(
                (item) => showThese.some((show) => show.id === item.id),
                (items) =>
                {
                    for (let item of items)
                    {
                        const mirrorMatch = showThese.find((show) => show.id === item.id);
                        if (mirrorMatch)
                        {
                            item.image.height = mirrorMatch.height;
                            item.image.width = mirrorMatch.width;
                            item.position.x = mirrorMatch.x;
                            item.position.y = mirrorMatch.y;
                            item.disableHit = false;
                            item.locked = false;
                        }
                    }
                });
            // Select the new guy(s)
            const selectedId = showThese.map(item => item.id);
            await OBR.player.select(selectedId);

            //Find attachments
            const attachedItems = await OBR.scene.items.getItems((item) => context.items.some(x => x.id === item.attachedTo));
            await OBR.scene.items.updateItems(attachedItems,
                (attachedments) =>
                {
                    // Find the old item it was attached to, swap to Id in the mirror data
                    for (let attachee of attachedments)
                    {
                        const oldParentMeta = context.items.find((item) => item.id === attachee.attachedTo)!.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as Metadata;
                        const oldParentMirror = oldParentMeta.mirror as Mirror;
                        attachee.attachedTo = oldParentMirror.id;
                    }
                });
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

                    // Get it's metadata to find the mirror and update it to be seen
                    const metadata = item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as Metadata;
                    const mirrored = metadata.mirror as Mirror;
                    mirrored.x = item.position.x;
                    mirrored.y = item.position.y;

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

                    // Make the mirrored pair visible and slightly offset from the original, based on the original's potition
                    // Also clear that metadata
                    await OBR.scene.items.updateItems(
                        (item) => item.id === mirrored.id,
                        (items) =>
                        {
                            for (let itemed of items)
                            {
                                itemed.image.height = mirrored.height;
                                itemed.image.width = mirrored.width;
                                itemed.position.x = mirrored.x! + (item.image.width / 2);
                                itemed.position.y = mirrored.y! + (item.image.height / 4);
                                itemed.disableHit = false;
                                itemed.locked = false;
                                itemed.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;
                            }
                        });
                }
                else
                {
                    const sameType = context.items.every(x=> x.layer === context.items[0].layer);

                    if (!sameType)
                    {
                        await OBR.notification.show("Bound items must be from the same Layer.", "WARNING");
                        return;
                    }

                    // If it's not a single, we're binding
                    await OBR.scene.items.updateItems(context.items, (items) =>
                    {
                        /// Create copies of the items so we don't reference values
                        const first = { ...items[0] };
                        const second = { ...items[1] };

                        for (let index = 0; index < items.length; index++)
                        {
                            // Take a mirror of the ID, height and width so we can zero out the mirrored
                            const mirror: Mirror = index === 0 ?
                                { id: second.id, height: second.image.height, width: second.image.width }
                                : { id: first.id, height: first.image.height, width: first.image.width };

                            items[index].metadata[`${Constants.EXTENSIONID}/metadata_bind`] = { mirror };

                            // Update the mirror to be hidden
                            if (index === 1)
                            {
                                items[1].image.height = 1;
                                items[1].image.width = 1;
                                items[1].position.x = 1;
                                items[1].position.y = 1;
                                items[1].disableHit = true;
                                items[1].locked = true;
                            }
                        }
                    });
                    // Select the first of the array since we hid the other guy
                    await OBR.player.select([context.items[0].id]);
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

            // Check that everyone has a buddy (see if the visible of the pair was deleted)
            const tobeDeleted: string[] = [];
            for (let item of itemsChanged)
            {
                // We're only dealing with Image data, so if it's not an image go away
                if (item.type !== "IMAGE") continue;

                const imItem = item as Image;
                if (imItem.image.height === 1 && imItem.image.width === 1
                    && imItem.metadata[`${Constants.EXTENSIONID}/metadata_bind`] !== undefined)
                {
                    const meta = imItem.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as any;
                    const mirrorMeta = meta.mirror as Mirror;

                    // If there is no bind metadata, it has no buddy - we can leave
                    if (!mirrorMeta.id) continue;

                    const mirrorPair = await OBR.scene.items.getItems([mirrorMeta.id]);
                    if (mirrorPair.length == 0)
                    {
                        // If we can't find it's pair, it must've been deleted. Clean the invisible partner up
                        tobeDeleted.push(imItem.id);
                    }
                }
            }
            // Delete all at once, not in a loop
            await OBR.scene.items.deleteItems(tobeDeleted);
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

// Interface for binding
interface Mirror
{
    id: string;
    height: number;
    width: number;
    x?: number,
    y?: number
}
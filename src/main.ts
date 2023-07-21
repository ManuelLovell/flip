import OBR, { Image, Metadata } from '@owlbear-rodeo/sdk'
import './style.css'
import { Constants } from './constants';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    You found my secret space.  There's nothing to do here.
    This extension basically is updated from one person - the GM's side. No reason for everyone to update, right?
    Otherwise you flip the button. So.. go away.
  </div>
`

OBR.onReady(async () =>
{
    const role = await OBR.player.getRole();
    if (role == "GM")
    {
        const sceneIsReady = await OBR.scene.isReady();
        if (sceneIsReady)
        {
            await SetupFlip();
        }
        else
        {
            await OBR.scene.onReadyChange(async (ready) =>
            {
                if (ready)
                {
                    await SetupFlip();
                }
                else
                {
                    //oops
                }
            });
        }
    }

    const ID = "com.battle-system.flip-menu";
    OBR.contextMenu.create({
        id: `${ID}/context-menu-flipit`,
        icons: [
            {
                icon: "/flip.svg",
                label: "Flip It",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined }
                    ],
                },
            },
            {
                icon: "/flip.svg",
                label: "Flip It!",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined, operator: "!=" }
                    ],
                },
            },
        ],
        async onClick(context, _: string)
        {
            const normalFlip = context.items.every(
                (item) => item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] === undefined
            );

            if (normalFlip)
            {
                await OBR.scene.items.updateItems(context.items, (items) =>
                {
                    for (let item of items)
                    {
                        item.scale.x = -(item.scale.x);
                    }
                });
            }
            else
            {
                const showThese: Mirror[] = [];
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
                        showThese.push(mirrored);
                    }
                });

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
                            }
                        }
                    });

                const selectedId = showThese.map(item => item.id);
                await OBR.player.select(selectedId);
            }
        }
    });

    OBR.contextMenu.create({
        id: `${ID}/context-menu-bindit`,
        icons: [
            {
                icon: "/combine.svg",
                label: "Bind It",
                filter: {
                    min: 2,
                    max: 2,
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined }
                    ],
                },
            },
            {
                icon: "/combine.svg",
                label: "UnBind It",
                filter: {
                    max: 1,
                    every: [
                        { key: "layer", value: "CHARACTER" },
                        { key: ["metadata", `${Constants.EXTENSIONID}/metadata_bind`], value: undefined, operator: "!=" }
                    ],
                },
            }
        ],
        async onClick(context, _: string)
        {
            if (context.items.length == 1)
            {
                const item = context.items[0] as Image;

                const metadata = item.metadata[`${Constants.EXTENSIONID}/metadata_bind`] as Metadata;
                const mirrored = metadata.mirror as Mirror;
                mirrored.x = item.position.x;
                mirrored.y = item.position.y;

                await OBR.scene.items.updateItems(
                    (original) => original.id === item.id,
                    (items) =>
                    {
                        for (let itemed of items)
                        {
                            itemed.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;
                        }
                    });

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
                            itemed.metadata[`${Constants.EXTENSIONID}/metadata_bind`] = undefined;
                        }
                    });
            }
            else
            {
                let number = 1;
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
                        }
                    }
                    number++;
                });
                await OBR.player.select([context.items[0].id]);
            }
        },
    });

    async function SetupFlip(): Promise<void>
    {
        await OBR.scene.items.onChange(async (itemsChanged) =>
        {
            await OBR.scene.items.updateItems(itemsChanged, (items) =>
            {
                for (let item of items)
                {
                    if (item.type !== "IMAGE") continue;

                    const anchor = (item.position.y * 1000) + (item.image.height / 6);
                    if ((item.zIndex !== anchor
                        && item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] !== undefined)
                        || item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] === undefined)
                    {
                        item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] = { anchor };
                        item.zIndex = anchor;
                    }
                }
            });
        });

        await OBR.scene.items.updateItems(
            (item) => item.layer === "CHARACTER" || item.layer === "MOUNT",
            (items) =>
            {
                UpdateZIndex(items);
            });
    }

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

interface Mirror
{
    id: string;
    height: number;
    width: number;
    x?: number,
    y?: number
}
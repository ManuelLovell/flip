import OBR, { Image } from '@owlbear-rodeo/sdk'
import './style.css'
import { Constants } from './constants';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    Muffins
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
        id: `${ID}/context-menu`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Flip It",
                filter: {
                    every: [
                        { key: "layer", value: "CHARACTER" },
                    ],
                },
            },
        ],
        async onClick(context, _: string)
        {
            OBR.scene.items.updateItems(context.items, (items) =>
            {
                for (let item of items)
                {
                    item.scale.x = -(item.scale.x);
                }
            });
        },
    });


    async function SetupFlip(): Promise<void>
    {
        await OBR.scene.items.onChange(async (items) =>
        {
            const updateTheseItems = [];
            const iItems = items as Image[];
            for (let item of iItems)
            {
                if (item.type !== "IMAGE") continue;

                const anchor = (item.position.y * 1000) + (item.image.height / 6);
                if ((item.type === "IMAGE"
                    && item.zIndex !== anchor
                    && item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] !== undefined)
                    || item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] === undefined)
                {
                    item.metadata[`${Constants.EXTENSIONID}/metadata_flip`] = { anchor };
                    item.zIndex = anchor;
                    updateTheseItems.push(item);
                }
                await OBR.scene.items.addItems(updateTheseItems); // Change to an update later
            }
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
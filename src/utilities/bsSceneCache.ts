import OBR, { Grid, Item, Metadata, Player, Theme } from "@owlbear-rodeo/sdk";
import * as Utilities from '../utilities/bsUtilities';
import { Constants, MetaSettings, SettingConstants } from './bsConstants';
import { SetupBindButton, SetupFlipButton } from "../flipSetupButtons";
import { FLIP } from "../flipMain";

class BSCache
{
    // Cache Names
    static PLAYER = "PLAYER";
    static PARTY = "PARTY";
    static SCENEITEMS = "SCENEITEMS";
    static SCENEMETA = "SCENEMETADATA";
    static SCENEGRID = "SCENEGRID";
    static ROOMMETA = "ROOMMETADATA";

    private debouncedOnSceneItemsChange: (items: Item[]) => void;
    private debouncedOnSceneMetadataChange: (items: Metadata) => void;

    CHARACTER_CACHE: any[];
    USER_REGISTERED: boolean;
    LOADING: boolean;
    playerId: string;
    playerColor: string;
    playerName: string;
    playerMetadata: {};
    playerRole: "GM" | "PLAYER";

    party: Player[];
    lastParty: Player[];

    gridDpi: number;
    gridScale: number; // IE; 5ft

    sceneItems: Item[];
    sceneSelected: string[];
    sceneMetadata: Metadata;
    sceneReady: boolean;

    oldRoomMetadata: Metadata;
    roomMetadata: Metadata;

    theme: any;

    caches: string[];

    BINDINGDISABLED = false;
    KEEPATTACHMENTS = false;

    ZLAYERING = '';
    ZMAPLAYER = false;
    ZGRIDLAYER = false;
    ZDRAWINGLAYER = false;
    ZPROPLAYER = false;
    ZMOUNTLAYER = false;
    ZCHARLAYER = false;
    ZATTACHLAYER = false;
    ZNOTELAYER = false;
    ZTEXTLAYER = false;

    //handlers
    sceneMetadataHandler?: () => void;
    sceneItemsHandler?: () => void;
    sceneGridHandler?: () => void;
    sceneReadyHandler?: () => void;
    playerHandler?: () => void;
    partyHandler?: () => void;
    themeHandler?: () => void;
    roomHandler?: () => void;

    constructor(caches: string[])
    {
        this.playerId = "";
        this.playerName = "";
        this.playerColor = "";
        this.playerMetadata = {};
        this.playerRole = "PLAYER";
        this.party = [];
        this.lastParty = [];
        this.sceneItems = [];
        this.sceneSelected = [];
        this.sceneMetadata = {};
        this.gridDpi = 0;
        this.gridScale = 5;
        this.sceneReady = false;
        this.theme = "DARK";
        this.oldRoomMetadata = {};
        this.roomMetadata = {};

        this.LOADING = false;
        this.CHARACTER_CACHE = [];
        this.USER_REGISTERED = false;
        this.caches = caches;

        // Large singular updates to sceneItems can cause the resulting onItemsChange to proc multiple times, at the same time
        this.debouncedOnSceneItemsChange = Utilities.Debounce(this.OnSceneItemsChange.bind(this) as any, 100);
        this.debouncedOnSceneMetadataChange = Utilities.Debounce(this.OnSceneMetadataChanges.bind(this) as any, 100);
    }

    public async InitializeCache()
    {
        // Always Cache
        this.sceneReady = await OBR.scene.isReady();
        this.theme = await OBR.theme.getTheme();

        Utilities.SetThemeMode(this.theme, document);

        if (this.caches.includes(BSCache.PLAYER))
        {
            this.playerId = await OBR.player.getId();
            this.playerName = await OBR.player.getName();
            this.playerColor = await OBR.player.getColor();
            this.playerMetadata = await OBR.player.getMetadata();
            this.playerRole = await OBR.player.getRole();
        }

        if (this.caches.includes(BSCache.PARTY))
        {
            this.party = await OBR.party.getPlayers();
        }

        if (this.caches.includes(BSCache.SCENEITEMS))
        {
            if (this.sceneReady) this.sceneItems = await OBR.scene.items.getItems();
        }

        if (this.caches.includes(BSCache.SCENEMETA))
        {
            if (this.sceneReady) this.sceneMetadata = await OBR.scene.getMetadata();
        }

        if (this.caches.includes(BSCache.SCENEGRID))
        {
            if (this.sceneReady)
            {
                this.gridDpi = await OBR.scene.grid.getDpi();
                this.gridScale = (await OBR.scene.grid.getScale()).parsed?.multiplier ?? 5;
            }
        }

        if (this.caches.includes(BSCache.ROOMMETA))
        {
            if (this.sceneReady) this.roomMetadata = await OBR.room.getMetadata();
            await this.SetupSettingDefaults();
        }

        await this.CheckRegistration();
    }

    public KillHandlers()
    {
        if (this.caches.includes(BSCache.SCENEMETA) && this.sceneMetadataHandler !== undefined) this.sceneMetadataHandler!();
        if (this.caches.includes(BSCache.SCENEITEMS) && this.sceneItemsHandler !== undefined) this.sceneItemsHandler!();
        if (this.caches.includes(BSCache.SCENEGRID) && this.sceneGridHandler !== undefined) this.sceneGridHandler!();
        if (this.caches.includes(BSCache.PLAYER) && this.playerHandler !== undefined) this.playerHandler!();
        if (this.caches.includes(BSCache.PARTY) && this.partyHandler !== undefined) this.partyHandler!();
        if (this.caches.includes(BSCache.ROOMMETA) && this.roomHandler !== undefined) this.roomHandler!();

        if (this.themeHandler !== undefined) this.themeHandler!();
    }

    public SetupHandlers()
    {

        if (this.sceneMetadataHandler === undefined || this.sceneMetadataHandler.length === 0)
        {
            if (this.caches.includes(BSCache.SCENEMETA))
            {
                this.sceneMetadataHandler = OBR.scene.onMetadataChange(async (metadata) =>
                {
                    this.sceneMetadata = metadata;
                    this.debouncedOnSceneMetadataChange(metadata);
                });
            }
        }

        if (this.sceneItemsHandler === undefined || this.sceneItemsHandler.length === 0)
        {
            if (this.caches.includes(BSCache.SCENEITEMS))
            {
                this.sceneItemsHandler = OBR.scene.items.onChange(async (items) =>
                {
                    this.sceneItems = items;
                    this.debouncedOnSceneItemsChange(items);
                });
            }
        }

        if (this.sceneGridHandler === undefined || this.sceneGridHandler.length === 0)
        {
            if (this.caches.includes(BSCache.SCENEGRID))
            {
                this.sceneGridHandler = OBR.scene.grid.onChange(async (grid) =>
                {
                    this.gridDpi = grid.dpi;
                    this.gridScale = parseInt(grid.scale);
                    await this.OnSceneGridChange(grid);
                });
            }
        }

        if (this.playerHandler === undefined || this.playerHandler.length === 0)
        {
            if (this.caches.includes(BSCache.PLAYER))
            {
                this.playerHandler = OBR.player.onChange(async (player) =>
                {
                    this.playerName = player.name;
                    this.playerColor = player.color;
                    this.playerId = player.id;
                    this.playerRole = player.role;
                    this.playerMetadata = player.metadata;
                    await this.OnPlayerChange(player);
                });
            }
        }

        if (this.partyHandler === undefined || this.partyHandler.length === 0)
        {
            if (this.caches.includes(BSCache.PARTY))
            {
                this.partyHandler = OBR.party.onChange(async (party) =>
                {
                    this.party = party.filter(x => x.id !== "");
                    await this.OnPartyChange(party);
                });
            }
        }

        if (this.roomHandler === undefined || this.roomHandler.length === 0)
        {
            if (this.caches.includes(BSCache.ROOMMETA))
            {
                this.roomHandler = OBR.room.onMetadataChange(async (metadata) =>
                {
                    this.roomMetadata = metadata;
                    await this.OnRoomMetadataChange(metadata);
                    this.oldRoomMetadata = metadata;
                });
            }
        }


        if (this.themeHandler === undefined)
        {
            this.themeHandler = OBR.theme.onChange(async (theme) =>
            {
                this.theme = theme.mode;
                await this.OnThemeChange(theme);
            });
        }

        // Only setup if we don't have one, never kill
        if (this.sceneReadyHandler === undefined)
        {
            this.sceneReadyHandler = OBR.scene.onReadyChange(async (ready) =>
            {
                this.sceneReady = ready;

                if (ready)
                {
                    this.sceneItems = await OBR.scene.items.getItems();
                    this.sceneMetadata = await OBR.scene.getMetadata();
                    this.gridDpi = await OBR.scene.grid.getDpi();
                    this.gridScale = (await OBR.scene.grid.getScale()).parsed?.multiplier ?? 5;
                }
                await this.OnSceneReadyChange(ready);
            });
        }
    }

    public async OnSceneMetadataChanges(_metadata: Metadata)
    {
    }

    public async UpdateZIndex(items: Item[])
    {
        // Build the array of applicable layers
        const layers: string[] = [];
        if (this.ZMAPLAYER) layers.push("MAP");
        if (this.ZGRIDLAYER) layers.push("GRID");
        if (this.ZDRAWINGLAYER) layers.push("DRAWING");
        if (this.ZPROPLAYER) layers.push("PROP");
        if (this.ZMOUNTLAYER) layers.push("MOUNT");
        if (this.ZCHARLAYER) layers.push("CHARACTER");
        if (this.ZATTACHLAYER) layers.push("ATTACHMENT");
        if (this.ZNOTELAYER) layers.push("NOTE");
        if (this.ZTEXTLAYER) layers.push("TEXT");

        await OBR.scene.items.updateItems(items, (mitems) =>
        {
            for (let item of mitems)
            {
                if (layers.includes(item.layer))
                {
                    // To give us a decent range to play in we multiply the position by alot and then work with the height
                    const anchor = item.type === "IMAGE" ? (item.position.y * 100) + (item.image.height / 6) : (item.position.y * 100);

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
    }

    public async OnSceneItemsChange(items: Item[])
    {
        if (this.sceneReady)
        {
            await this.UpdateZIndex(items);
        }
    }

    public async OnSceneGridChange(_grid: Grid)
    {

    }

    public async OnSceneReadyChange(ready: boolean)
    {
        if (ready)
        {
            await FLIP.Initialize();
        }
    }

    public async OnPlayerChange(_player: Player)
    {
    }

    public async OnPartyChange(_party: Player[])
    {
    }

    public async SetupSettingDefaults(): Promise<void>
    {
        this.BINDINGDISABLED = Utilities.Reta(MetaSettings.DISABLEBIND) ?? false;
        this.KEEPATTACHMENTS = Utilities.Reta(MetaSettings.KEEPATTACH) ?? false;
        this.ZLAYERING = Utilities.Reta(MetaSettings.ZINDEXES) ?? '';

        this.ZMAPLAYER = this.ZLAYERING.includes(SettingConstants.MAPLAYER);
        this.ZGRIDLAYER = this.ZLAYERING.includes(SettingConstants.GRIDLAYER);
        this.ZDRAWINGLAYER = this.ZLAYERING.includes(SettingConstants.DRAWINGLAYER);
        this.ZPROPLAYER = this.ZLAYERING.includes(SettingConstants.PROPLAYER);
        this.ZMOUNTLAYER = this.ZLAYERING.includes(SettingConstants.MOUNTLAYER);
        this.ZCHARLAYER = this.ZLAYERING.includes(SettingConstants.CHARACTERLAYER);
        this.ZATTACHLAYER = this.ZLAYERING.includes(SettingConstants.ATTACHLAYER);
        this.ZNOTELAYER = this.ZLAYERING.includes(SettingConstants.NOTELAYER);
        this.ZTEXTLAYER = this.ZLAYERING.includes(SettingConstants.TEXTLAYER);

        // Only process if there is a change.
        if (this.roomMetadata[MetaSettings.DISABLEBIND] !== this.oldRoomMetadata[MetaSettings.DISABLEBIND])
        {
            if (this.playerRole === "PLAYER")
            {
                if (this.BINDINGDISABLED)
                {
                    await OBR.contextMenu.remove(Constants.CONTEXTBINDID);
                    await OBR.contextMenu.remove(Constants.CONTEXTFLOPID);
                }
                else
                    await SetupBindButton();
                await SetupFlipButton();
            }
        }
    }
    public async OnRoomMetadataChange(_metadata: Metadata)
    {
        await this.SetupSettingDefaults();
    }

    public async OnThemeChange(theme: Theme)
    {
        Utilities.SetThemeMode(theme, document);
    }

    public GetZIndexSettingString(): string
    {
        let string = '';
        if (this.ZMAPLAYER) string += SettingConstants.MAPLAYER;
        if (this.ZGRIDLAYER) string += SettingConstants.GRIDLAYER;
        if (this.ZDRAWINGLAYER) string += SettingConstants.DRAWINGLAYER;
        if (this.ZPROPLAYER) string += SettingConstants.PROPLAYER;
        if (this.ZMOUNTLAYER) string += SettingConstants.MOUNTLAYER;
        if (this.ZCHARLAYER) string += SettingConstants.CHARACTERLAYER;
        if (this.ZATTACHLAYER) string += SettingConstants.ATTACHLAYER;
        if (this.ZNOTELAYER) string += SettingConstants.NOTELAYER;
        if (this.ZTEXTLAYER) string += SettingConstants.TEXTLAYER;
        return string;
    }

    public async CheckRegistration()
    {
        try
        {
            const debug = window.location.origin.includes("localhost") ? "eternaldream" : "";
            const userid = {
                owlbearid: BSCACHE.playerId
            };

            const requestOptions = {
                method: "POST",
                headers: new Headers({
                    "Content-Type": "application/json",
                    "Authorization": Constants.ANONAUTH,
                    "x-manuel": debug
                }),
                body: JSON.stringify(userid),
            };
            const response = await fetch(Constants.CHECKREGISTRATION, requestOptions);

            if (!response.ok)
            {
                const errorData = await response.json();
                // Handle error data
                console.error("Error:", errorData);
                return;
            }
            const data = await response.json();
            if (data.Data === "OK")
            {
                this.USER_REGISTERED = true;
                console.log("Connected");
            }
            else console.log("Not Registered");
        }
        catch (error)
        {
            // Handle errors
            console.error("Error:", error);
        }
    }
};

// Set the handlers needed for this Extension
export const BSCACHE = new BSCache([BSCache.ROOMMETA, BSCache.SCENEITEMS, BSCache.PLAYER]);

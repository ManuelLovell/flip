import OBR from '@owlbear-rodeo/sdk'
import * as Utilities from './utilities/bsUtilities';
import { SetupFlipButton, SetupReverseButton, SetupBindButton } from './flipSetupButtons';
import { BSCACHE } from './utilities/bsSceneCache';
import { Constants, MetaSettings, SettingConstants } from './utilities/bsConstants';
import { SetCheckbox } from './utilities/bsSettingUtils';
import './styles/style.css'

class Flip
{
    appWindow: HTMLDivElement;

    constructor()
    {
        this.appWindow = document.getElementById('app') as HTMLDivElement;
    }

    public async Initialize()
    {
        this.appWindow = document.getElementById('app') as HTMLDivElement;

        // Do all setup through the GM role so we don't have multiple updates
        if (BSCACHE.playerRole === "GM")
        {
            this.appWindow.innerHTML = Constants.MAINHTML;

            if (BSCACHE.sceneReady) await BSCACHE.UpdateZIndex(BSCACHE.sceneItems);

            SetCheckbox(SettingConstants.DISABLEBIND, Utilities.Reta(MetaSettings.DISABLEBIND));
            SetCheckbox(SettingConstants.KEEPATTACH, Utilities.Reta(MetaSettings.KEEPATTACH));

            SetCheckbox(SettingConstants.MAPLAYER, Utilities.Zeta(SettingConstants.MAPLAYER));
            SetCheckbox(SettingConstants.DRAWINGLAYER, Utilities.Zeta(SettingConstants.DRAWINGLAYER));
            SetCheckbox(SettingConstants.PROPLAYER, Utilities.Zeta(SettingConstants.PROPLAYER));
            SetCheckbox(SettingConstants.MOUNTLAYER, Utilities.Zeta(SettingConstants.MOUNTLAYER));
            SetCheckbox(SettingConstants.CHARACTERLAYER, Utilities.Zeta(SettingConstants.CHARACTERLAYER));
            SetCheckbox(SettingConstants.ATTACHLAYER, Utilities.Zeta(SettingConstants.ATTACHLAYER));
            SetCheckbox(SettingConstants.NOTELAYER, Utilities.Zeta(SettingConstants.NOTELAYER));
            SetCheckbox(SettingConstants.TEXTLAYER, Utilities.Zeta(SettingConstants.TEXTLAYER));
            //SetCheckbox(SettingConstants.GRIDLAYER, Utilities.Zeta(SettingConstants.GRIDLAYER));
        }
        else
        {
            this.appWindow.innerHTML = `<div id="playerView">Configuration is GM only.<div id="whatsNew"></div></div>`;
            await OBR.action.setHeight(50);
        }

        const whatsNewContainer = document.getElementById("whatsNew") as HTMLDivElement;
        whatsNewContainer.appendChild(Utilities.GetWhatsNewButton());

        // We can setup our contextmenu anytime
        await SetupFlipButton();
        await SetupReverseButton();
        await SetupBindButton();
    }
}

export const FLIP = new Flip();
OBR.onReady(async () =>
{
    const sceneReady = await OBR.scene.isReady();

    if (sceneReady === false)
    {
        const startup = OBR.scene.onReadyChange(async (ready) =>
        {
            if (ready)
            {
                startup(); // Kill startup Handler
                await StartFlip();
            }
        });
    }
    else
    {
        await StartFlip();
    }

});

async function StartFlip()
{
    // Safety Check for WhatsNew Re-Initializing
    const mainapp = document.getElementById('app');
    if (!mainapp) return;

    await BSCACHE.InitializeCache();

    BSCACHE.SetupHandlers();

    await FLIP.Initialize();

    // We can setup our contextmenu anytime
    await SetupFlipButton();
    await SetupReverseButton();
    await SetupBindButton();
}
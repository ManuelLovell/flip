import OBR from "@owlbear-rodeo/sdk";
import { MetaSettings, SettingConstants } from "./bsConstants";
import { BSCACHE } from "./bsSceneCache";

/// Settings Setup
export function CreateSlider(id: string): string
{
    return `<label class="switch" id="setting${id}Container">
        <span class="slider round"></span>
        </label>`;
};

export function SetCheckbox(id: string, setting: boolean)
{
    const container = document.getElementById(`setting${id}Container`);
    const slider = document.createElement('input');
    slider.type = "checkbox";
    slider.value = String(setting);
    slider.checked = setting;
    slider.onclick = async function (element)
    {
        const target = element.target as HTMLInputElement;
        slider.value = String(target.checked);
        switch (id)
        {
            case SettingConstants.DISABLEBIND:
                await OBR.room.setMetadata({ [MetaSettings.DISABLEBIND]: target.checked });
                break;
            case SettingConstants.KEEPATTACH:
                await OBR.room.setMetadata({ [MetaSettings.KEEPATTACH]: target.checked });
                break;
            case SettingConstants.MAPLAYER:
                await UpdateLayering(SettingConstants.MAPLAYER, target.checked);
                break;
            case SettingConstants.DRAWINGLAYER:
                await UpdateLayering(SettingConstants.DRAWINGLAYER, target.checked);
                break;
            case SettingConstants.PROPLAYER:
                await UpdateLayering(SettingConstants.PROPLAYER, target.checked);
                break;
            case SettingConstants.MOUNTLAYER:
                await UpdateLayering(SettingConstants.MOUNTLAYER, target.checked);
                break;
            case SettingConstants.CHARACTERLAYER:
                await UpdateLayering(SettingConstants.CHARACTERLAYER, target.checked);
                break;
            case SettingConstants.ATTACHLAYER:
                await UpdateLayering(SettingConstants.ATTACHLAYER, target.checked);
                break;
            case SettingConstants.NOTELAYER:
                await UpdateLayering(SettingConstants.NOTELAYER, target.checked);
                break;
            case SettingConstants.TEXTLAYER:
                await UpdateLayering(SettingConstants.TEXTLAYER, target.checked);
                break;
            default:
                break;
        }
    };
    container?.insertBefore(slider, container.firstChild);

    async function UpdateLayering(setting: string, checked: boolean)
    {
        const newLayering = checked ? BSCACHE.ZLAYERING += setting : BSCACHE.ZLAYERING.split(setting).join('');
        await OBR.room.setMetadata({ [MetaSettings.ZINDEXES]: newLayering });
    }
};
///
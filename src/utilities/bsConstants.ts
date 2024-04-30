import { CreateSlider } from "./bsSettingUtils";

export class SettingConstants
{
    static MAPLAYER = "M";
    static GRIDLAYER = "G";
    static DRAWINGLAYER = "D";
    static PROPLAYER = "P";
    static MOUNTLAYER = "H"; // For horse.
    static CHARACTERLAYER = "C";
    static ATTACHLAYER = "A";
    static NOTELAYER = "N";
    static TEXTLAYER = "T";
    static DISABLEBIND = "NOBIND";
    static KEEPATTACH = "KEEPATTACH";
}

export class Constants
{
    static EXTENSIONID = "com.battle-system.flip";
    static EXTENSIONWHATSNEW = "com.battle-system.flip-whatsnew";
    static VERSION = "whatsnew-flip-201";
    static CONTEXTFLIPID = "com.battle-system.flip-menu/context-menu-flipit";
    static CONTEXTFLOPID = "com.battle-system.flip-menu/context-menu-flopit";
    static CONTEXTBINDID = "com.battle-system.flip-menu/context-menu-bindit";
    static ANONAUTH = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    static CHECKREGISTRATION = 'https://vrwtdtmnbyhaehtitrlb.supabase.co/functions/v1/patreon-check';

    static MAINHTML = `
    <div class="container">
        <table>
            <thead>
                <tr class="head-title">
                    <th>Flip!</th>
                    <th></th>
                    <th></th>
                    <th><div id="whatsNew"></div></th>
                </tr>
            </thead>
            <tbody>
                <tr title="Removes the button for players that allows binding tokens together.">
                    <td colspan ="3">Disable Player Bind</td>
                    <td>${CreateSlider(SettingConstants.DISABLEBIND)}</td>
                </tr>
                <tr title="Makes it so attachments stay with the parent token when Flipping.">
                    <td colspan ="3">Attachments with Parent</td>
                    <td>${CreateSlider(SettingConstants.KEEPATTACH)}</td>
                </tr>
                <tr title="Controls which layers the auto Z-Indexing is active on.">
                    <td class="title" colspan ="4">Z-Indexing Layers</td>
                </tr>
                <tr>
                    <td>Map</td>
                    <td>${CreateSlider(SettingConstants.MAPLAYER)}</td>
                    <td>Prop</td>
                    <td>${CreateSlider(SettingConstants.PROPLAYER)}</td>
                </tr>
                <tr>
                    <td>Character</td>
                    <td>${CreateSlider(SettingConstants.CHARACTERLAYER)}</td>
                    <td>Mount</td>
                    <td>${CreateSlider(SettingConstants.MOUNTLAYER)}</td>
                </tr>
                <tr>
                    <td>Attachment</td>
                    <td>${CreateSlider(SettingConstants.ATTACHLAYER)}</td>
                    <td>Note</td>
                    <td>${CreateSlider(SettingConstants.NOTELAYER)}</td>
                </tr>
                <tr>
                    <td>Drawing</td>
                    <td>${CreateSlider(SettingConstants.DRAWINGLAYER)}</td>
                    <td>Text</td>
                    <td>${CreateSlider(SettingConstants.TEXTLAYER)}</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}


export class MetaSettings
{
    static DISABLEBIND = `${Constants.EXTENSIONID}/disableBinding`;
    static KEEPATTACH = `${Constants.EXTENSIONID}/attachmentParent`;
    static ZINDEXES = `${Constants.EXTENSIONID}/zLayering`;
}
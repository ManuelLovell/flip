import{O as n,C as r}from"./flipMain-fd0c658a.js";const l=document.querySelector("#bs-whatsnew"),d=document.querySelector("#bs-whatsnew-notes");l.innerHTML=`
  <div id="newsContainer">
    <h1>Flip! 4/30</h1>
    Minor bug fix with caching attachments (And the Attachments with Parent setting).
    </br> It wasn't updating when you removed the attachment on a bound item.
    </br> Also updated the selection post-flip so it doesn't include the attachment(s). So the context buttons should stay. Meaning you can flip-flip-flip without having to reselect.
    </br> Thank you, Baido for the report.
    <h1>Flip! 4/10</h1>
    So you'll need to reconfigure your settings - the Z-Indexing has been broken down by layer to allow for more minute control.
    </br> Disabling player binding will now also disable their ability to 'Flip it' to the other side.  This is to avoid a player clicking an item and seeing the button, indicating it has another side.
    </br> Also (obviously) cleaned up the settings a little, and added this .. standard little What's New.
    </br> Enjoy.
    <h1>Flip! 3/17</h1>
    Have people doing complicated things with Flip, so some fixing to account for it.
    </br> When keeping attachments with the parent item, previously if you made a copy of that item (while the attachments were hidden), when it was Flipped and brought back to the scene it wouldn't behave correctly because it was essentially a saved state.  Now Flip will check for conflicts and re-assign Ids if needed from things being duplicated.
    </br>
    <h1>Flip! 3/13</h1>
    Fixed a bug with player's being unable to properly flip items that have bound attachments.
    </br>
    <h1>Flip! 1/9</h1>
    More cohesion.
    </br>
    The logic on Flip It!! has been improved, as well as how the object is 'stored' when it's been tied together. Which itself should help with keeping things cleaner and no lingering objects if you delete things.
    </br>
    </br>
    Also at the behest of Andrew (SeveralRecord on Discord/Reddit), a toggle for Attachments has been added.
    </br>
    Keep Attachment with Parent (On) - If you have a paladin with an 'aura' attachment, and his 'bound' side is a werewolf - when you flip it, the aura will disappear. It'll come back when he's a paladin again.
    </br>
    Keep Attachment with Parent (Off) - In the same scenario, the 'aura' attachment will stay whether it's a paladin or werewolf.
    </br>
    </br>
    Enjoy!
    </br>
    </br>
  </div>
`;n.onReady(async()=>{const o=window.location.search,e=new URLSearchParams(o).get("subscriber")==="true";d.innerHTML=`
        <div id="footButtonContainer">
            <button id="discordButton" type="button" title="Join the Owlbear-Rodeo Discord"><embed class="svg discord" src="/w-discord.svg" /></button>
            <button id="patreonButton" type="button" ${e?'title="Thank you for subscribing!"':'title="Check out the Battle-System Patreon"'}>
            ${e?'<embed id="patreonLogo" class="svg thankyou" src="/thankyou.svg" />':'<embed id="patreonLogo" class="svg patreon" src="/w-patreon.png" />'}</button>
        </div>
        <button id="closeButton" type="button" title="Close this window"><embed class="svg close" src="/w-close.svg" /></button>
        `;const i=document.getElementById("closeButton");i.onclick=async()=>{await n.modal.close(r.EXTENSIONWHATSNEW)};const a=document.getElementById("discordButton");a.onclick=async t=>{t.preventDefault(),window.open("https://discord.gg/ANZKDmWzr6","_blank")};const s=document.getElementById("patreonButton");s.onclick=async t=>{t.preventDefault(),window.open("https://www.patreon.com/battlesystem","_blank")}});

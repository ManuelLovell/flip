import{O as e,C as a}from"./constants-6b42fd96.js";const n=document.querySelector("#bs-whatsnew"),o=document.querySelector("#bs-whatsnew-notes");n.innerHTML=`
  <div id="newsContainer">
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
`;e.onReady(async()=>{o.innerHTML=`
    <a href="https://www.patreon.com/battlesystem" target="_blank">Patreon!</a>
    <a href="https://discord.gg/ANZKDmWzr6" target="_blank">Join the OBR Discord!</a>
    <div class="close"><img style="height:40px; width:40px;" src="/close-button.svg"</div>`;const t=document.querySelector(".close");t.onclick=async()=>{await e.modal.close(a.EXTENSIONWHATSNEW)}});

// ==UserScript==
// @name         按鍵與滑鼠滾輪翻頁器
// @name:zh-TW   按鍵與滑鼠滾輪翻頁器
// @name:ja      キーとマウスホイールでのページめくり機
// @name:en      Keyboard and Mouse Wheel Page Turner
// @namespace    https://github.com/Max46656
// @version      1.07
// @description  自動切換頁面，使用滑鼠滾輪或按鍵觸發翻頁。在Pixiv頁面載入後自動展開所有作品。
// @description:zh-TW 自動切換頁面，使用滑鼠滾輪或按鍵觸發翻頁。在Pixiv頁面載入後自動展開所有作品。
// @description:ja スクロールまたはキーでページめくりを自動的に切り替えます。Pixivページの読み込み後、すべての作品を自動的に展開します。
// @description:en Automatically switch pages using mouse wheel or keyboard triggers. Automatically expands all works after the page is fully loaded on Pixiv pages.
// @author       Max
// @match        https://www.pixiv.net/*
// @match        https://kemono.su/*
// @match        https://kemono.party/*
// @match        https://coomer.su/*
// @match        https://coomer.party/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pixiv.net
// @grant    GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license MPL2.0
// ==/UserScript==

class PageInputNavigation {
    constructor() {
        this.registerMenuCommand(this);
        this.pageButtons = this.getPageButtonsByDomain();
        this.buttonClicked = false;
        this.loadPageKey();
        this.setEventListeners();
    }

    async inputModeSwitch() {
        //console.log("切換模式"+this.buttonClicked);
        if (this.buttonClicked==true) {
            window.removeEventListener("scroll", this.scrollHandler);
            window.addEventListener("keypress", this.keyPressHandler);
            console.log("切換為按鍵翻頁模式");
            this.buttonClicked=false;
        } else {
            window.addEventListener("scroll", this.scrollHandler);
            window.removeEventListener("keypress", this.keyPressHandler);
            console.log("切換為滾輪翻頁模式");
            this.buttonClicked=true;
        }
    }

    async toNextPage() {
        const pageButtons = document.querySelectorAll(this.pageButtons.nextButton);
        let nextPageButton;
        if (pageButtons.length === 1) {
            nextPageButton = pageButtons[0];
        } else if (pageButtons.length >= 2) {
            nextPageButton = pageButtons[1];
        }
        if (nextPageButton) {
            nextPageButton.click();
        }
    }

    async toPrevPage() {
        const prevPageButton = document.querySelectorAll(this.pageButtons.prevButton)[0];
        if (prevPageButton) {
            prevPageButton.click();
        }
    }
    //使用網址頁面跳轉使整體頁面重新載入，其預設位置回歸頁面頂端而非如同按鈕跳至作品集頂端。
    //然而即便按鈕對應的標籤改變，以網址進行跳轉仍然是可靠的，作為使用者的救急更換。
    //         getPatternsByDomain() {
    //     const pagePatterns = {
    //       "www.pixiv.net": {
    //         "artistHomePattern": /^https:\/\/www.pixiv.net\/users\/[0-9]*$/,
    //         "artworksPattern": /^https:\/\/www.pixiv.net\/users\/[0-9]+\/artworks\?p=[0-9]+$/,
    //         "artworkPattern": /^https:\/\/www.pixiv.net\/users\/[0-9]*\/artworks$/,
    //       },
    //     };
    //     const domain = window.location.hostname;
    //     //console.log(patterns[domain]);
    //     return pagePatterns[domain];
    //   }
    //     toNextPage() {
    //         const patterns = this.getPatternsByDomain();
    //         if (patterns) {
    //             const artworkPattern = patterns["artworkPattern"];
    //             const artworksPattern = patterns["artworksPattern"];

    //             if (artworkPattern && artworkPattern.test(window.location.href)) {
    //                 let newURL=window.history.replaceState(null, null, window.location.href + "?p=1");
    //                 window.location.href = newURL;
    //             }
    //             if (artworksPattern && artworksPattern.test(window.location.href)) {
    //                 const currentPage = parseInt(window.location.href.match(/\?p=([0-9]+)/)[1]);
    //                 const nextPage = currentPage + 1;
    //                 const newURL = window.location.href.replace(/\?p=[0-9]+/, `?p=${nextPage}`);
    //                 window.location.href = newURL;
    //             }
    //         }
    //     }
    //     toPrevPage() {
    //         const patterns = this.getPatternsByDomain();
    //         if (patterns) {
    //             const artworkPattern = patterns["artworkPattern"];
    //             const artworksPattern = patterns["artworksPattern"];

    //             if (artworkPattern && artworkPattern.test(window.location.href)) {
    //                 window.history.replaceState(null, null, window.location.href + "?p=1");
    //                 window.location.reload(); // 重新載入頁面，使預設位置回歸頁面頂端
    //             }

    //             if (artworksPattern && artworksPattern.test(window.location.href)) {
    //                 const currentPage = parseInt(window.location.href.match(/\?p=([0-9]+)/)[1]);
    //                 const prevPage = currentPage - 1;
    //                 const newURL = window.location.href.replace(/\?p=[0-9]+/, `?p=${prevPage}`);
    //                 window.location.href = newURL;
    //             }
    //         }
    //     }

    //此功能目前僅pivix需要
    expandAllWorks() {
        try {
            const patterns = this.getPatternsByDomain();
            const artistHomePattern = patterns.artistHomePattern;
            if (artistHomePattern && artistHomePattern.test(window.location.href)) {
                window.history.replaceState(null, null, window.location.href + "/artworks?p=1");
            }
        } catch (e) {
        }
    }

    handleScroll(scrollThreshold=3) {
        const isBottom = document.documentElement.scrollHeight - window.innerHeight - window.pageYOffset <= this.scrollThreshold;
        if (isBottom) {
            this.toNextPage();
            console.log("滾輪下一頁");
        }
        if (window.pageYOffset <= 0) {
            this.toPrevPage();
            console.log("滾輪上一頁");
        }
    }

    handleKeyPress(event) {
        let prevPageUpper = this.pageKey[0].toUpperCase();
        let nextPageUpper = this.pageKey[1].toUpperCase();
        let prevPageLower = this.pageKey[0].toLowerCase();
        let nextPageLower = this.pageKey[1].toLowerCase();
        if (event.key == prevPageUpper || event.key == prevPageLower) {
            this.toPrevPage();
            console.log("按鍵上一頁");
        } else if (event.key == nextPageUpper || event.key == nextPageLower) {
            this.toNextPage();
            console.log("按鍵下一頁");
        }
    }

    async customizeKeys() {
        //console.log(this.getFeatureMessageLocalization("EnterNewPrevPageLetter"));
        const newPrevPage = prompt(this.getFeatureMessageLocalization("EnterNewPrevPageLetter"));
        const newNextPage = prompt(this.getFeatureMessageLocalization("EnterNewNextPageLetter"));

        if (newPrevPage && newPrevPage.length === 1 && newNextPage && newNextPage.length === 1) {
            this.pageKey[0] = newPrevPage;
            this.pageKey[1] = newNextPage;
            this.savePageKey();
        } else {
            alert(this.getFeatureMessageLocalization("CustomKeyError"));
        }
    }

    loadPageKey() {
        this.pageKey = GM_getValue("pageKey", ["Z", "X"]);
    }
    savePageKey() {
        GM_setValue("pageKey", this.pageKey);
    }

    setEventListeners() {
        this.scrollHandler = () => this.handleScroll();
        this.keyPressHandler = (event) => this.handleKeyPress(event);
        window.addEventListener("keypress", this.keyPressHandler);
        this.expandAllWorks();
        //console.log("開始聆聽");
    }

    getPageButtonsByDomain(){
        const pageButtons={
            "www.pixiv.net" : {
                "nextButton" : ".sc-d98f2c-0.sc-xhhh7v-2.cCkJiq.sc-xhhh7v-1-filterProps-Styled-Component.kKBslM",
                "prevButton" : ".sc-d98f2c-0.sc-xhhh7v-2.cCkJiq.sc-xhhh7v-1-filterProps-Styled-Component.kKBslM",
            },
            "kemono.su" : {
                "nextButton" : ".next",
                "prevButton" : ".prev",
            },
            "coomer.su" : {
                "nextButton" : ".next",
                "prevButton" : ".prev",
            },
        };
        const domain = window.location.hostname;
        console.log(domain);
        return pageButtons[domain];
    }

    getFeatureMessageLocalization(word) {
        let display = {
            "zh-TW": {
                "TogglePageMode": "切換翻頁模式",
                "CustomizeKeys": "自訂按鍵",
                "EnterNewPrevPageLetter": "請輸入要替換上一頁的一個英文字母或數字:",
                "EnterNewNextPageLetter": "請輸入要替換下一頁的一個英文字母或數字:",
                "CustomKeyError": "自訂按鍵錯誤：輸入無效，請確保輸入一個英文字母或數字。"
            },
            "en": {
                "TogglePageMode": "Toggle Page Navigation Mode",
                "CustomizeKeys": "Customize Keys",
                "EnterNewPrevPageLetter": "Enter a single English letter or number to replace the previous page:",
                "EnterNewNextPageLetter": "Enter a single English letter or number to replace the next page:",
                "CustomKeyError": "Custom Key Error: Invalid input, please ensure to input a single English letter or number."
            },
            "ja": {
                "TogglePageMode": "ページ切り替えモードの切り替え",
                "CustomizeKeys": "キーのカスタマイズ",
                "EnterNewPrevPageLetter": "前のページを置き換える英字または数字を 1 つ入力してください:",
                "EnterNewNextPageLetter": "次のページを置き換える英字または数字を 1 つ入力してください:",
                "CustomKeyError": "カスタムキーエラー：入力が無効です。単一の英文字または数字を入力してください。"
            }
        };
        //console.log(navigator.language);
        //console.log(display[navigator.language][word]);
        return display[navigator.language][word];
    }

    registerMenuCommand(instance) {
        //console.log("註冊選單");
        GM_registerMenuCommand(instance.getFeatureMessageLocalization("TogglePageMode"), () => instance.inputModeSwitch());
        GM_registerMenuCommand(instance.getFeatureMessageLocalization("CustomizeKeys"), () => instance.customizeKeys());
    }
}

const johnTheAlmondHolder = new PageInputNavigation();
document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const mainInput = document.getElementById('main-input');
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    const btnCreateImage = document.getElementById('btn-create-image');
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    const btnMd5 = document.getElementById('btn-md5');

    // --- 常量定义 ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 辅助函数 ---
    function randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;';
        document.body.appendChild(toast);
        setTimeout(() => { document.body.removeChild(toast); }, 2000);
    }

    // --- 核心加解密函数 ---

    // 标准AES加密 (用于凤凰系统)
    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const encrypted = CryptoJS.AES.encrypt(data, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.toString();
    }

    // 标准AES解密 (用于凤凰系统)
    function decryptAes(ciphertext, key, iv) {
        try {
            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(iv);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) { return null; }
    }

    /**
     * 线路仓(VOD)的内层CBC加密函数
     * 使用了.padEnd()来完美复刻Java端的补0逻辑
     */
    function encryptVod(plaintext) {
        try {
            const key = randomString(16);
            const realIv = randomString(13);
            
            // ▼▼▼ 使用.padEnd()实现最关键、最精确的“补0”逻辑 ▼▼▼
            const aesIv = realIv.padEnd(16, '0');
            // ▲▲▲ 确保与Java端行为100%一致 ▲▲▲

            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(aesIv);
            const plaintextWords = CryptoJS.enc.Utf8.parse(plaintext);
            const encrypted = CryptoJS.AES.encrypt(plaintextWords, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

            const prefix = randomString(10) + "$#" + key + "#$" + randomString(10);
            const headerWithIv = prefix + realIv;
            const headerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(headerWithIv)).toUpperCase();
            const footerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(randomString(13))).toUpperCase();

            return "2423" + headerHex + "2324" + encryptedHex + footerHex;
        } catch (e) {
            console.error("Encrypt VOD Error:", e);
            return null;
        }
    }
    
    /**
     * 新增的“套娃”加密函数 (线路仓专用)
     * 它会调用原始的VOD加密，然后进行Base64封装
     */
    function encryptVodNested(plaintext) {
        const innerEncrypted = encryptVod(plaintext);
        if (!innerEncrypted) return null;

        // 使用btoa()进行外层Base64编码
        const base64Encoded = btoa(innerEncrypted);

        // 添加**格式的头部，生成最终产物
        return randomString(8) + "**" + base64Encoded;
    }

    // 线路仓(VOD)的解密函数 (保持原样)
    function decryptVod(ciphertext) {
        try {
            if (!ciphertext.startsWith("2423")) return null;

            const cipherWords = CryptoJS.enc.Hex.parse(ciphertext);
            const decodedHexStr = cipherWords.toString(CryptoJS.enc.Latin1);

            const key = decodedHexStr.substring(decodedHexStr.indexOf("$#") + 2, decodedHexStr.indexOf("#$"));
            const realIv = decodedHexStr.substring(decodedHexStr.length - 13);
            
            // 解密端同样需要补0逻辑
            const aesIv = realIv.padEnd(16, '0');
            
            const encryptedDataHex = ciphertext.substring(ciphertext.indexOf("2324") + 4, ciphertext.length - 26);
            
            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(aesIv);
            const encryptedWords = CryptoJS.enc.Hex.parse(encryptedDataHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWords }, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decrypt VOD Error:", e);
            return null;
        }
    }

    function createSteganographyImage(configText) {
        showToast("生成图片功能待实现...");
    }

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");

    // “双重加密(VOD)”按钮调用新的“套娃”函数
    btnEncryptVod.addEventListener('click', () => { 
        const result = encryptVodNested(mainInput.value);
        if (result) {
            mainInput.value = result;
        } else {
            showToast('加密失败！');
        }
    });

    // “双重解密(VOD)”按钮兼容新的“套娃”格式
    btnDecryptVod.addEventListener('click', () => {
        let content = mainInput.value;
        if (content.includes('**')) {
            try { 
                // 使用atob()先解开外层的Base64壳
                content = atob(content.split('**')[1]); 
            } catch (e) {
                showToast('Base64解码失败！');
                return;
            }
        }
        const r = decryptVod(content);
        if (r) mainInput.value = r; else showToast('解密失败！');
    });

    // --- 其他按钮的事件监听保持不变 ---
    btnCreateImage.addEventListener('click', () => createSteganographyImage(mainInput.value));
    
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});

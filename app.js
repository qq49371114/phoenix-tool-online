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

    // --- 常量定义 (凤凰系统专用) ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 辅助函数 ---
    function randomString(length) { let result = ''; const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * characters.length)); } return result; }
    function showToast(message) { const toast = document.createElement('div'); toast.textContent = message; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; document.body.appendChild(toast); setTimeout(() => { document.body.removeChild(toast); }, 2000); }

    // ====================  ↓↓↓ 【归来计划】我们自己的VOD加密核心 (最终版) ↓↓↓ ====================
    /**
     * 【已重铸】我们自己的、复杂的、动态密钥的VOD加密函数
     */
    function encryptVod(plaintext) {
        try {
            // 1. 动态生成一次性的Key和IV
            const key = randomString(16);
            const realIv = randomString(13);

            // 2. 准备加密用的Key和IV (补足16位)
            const aesKey = key.padEnd(16, '0');
            const aesIv = realIv.padEnd(16, '0');
            const keyWords = CryptoJS.enc.Utf8.parse(aesKey);
            const ivWords = CryptoJS.enc.Utf8.parse(aesIv);

            // 3. 执行核心加密，得到Hex格式的密文主体
            const encrypted = CryptoJS.AES.encrypt(plaintext, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

            // 4. 构造头部，将动态生成的Key和IV隐藏在其中
            const prefix = randomString(10);
            const suffix = randomString(10);
            const headerStr = prefix + "$#" + key + "#$" + suffix + realIv;
            const headerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(headerStr));

            // 5. 构造一个符合Java端长度校验的假尾部
            const footerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(randomString(13)));

            // 6. 拼接成我们自己的、以2423开头的最终格式
            return "2423" + headerHex + "2324" + encryptedHex + footerHex;
        } catch (e) {
            console.error("Encrypt VOD Error:", e);
            return null;
        }
    }
    
    /**
     * 【保持不变】我们自己的、复杂的VOD解密函数
     * 它就是我们从Java翻译过来的“锁”
     */
    function decryptVod(ciphertext) {
        try {
            if (!ciphertext.startsWith("2423")) return null;
            // 使用Latin1强制转换，来模拟Java端那个可能出错的行为
            const decode = CryptoJS.enc.Hex.parse(ciphertext).toString(CryptoJS.enc.Latin1).toLowerCase();
            const key = decode.substring(decode.indexOf('$#') + 2, decode.indexOf('#$')).padEnd(16, '0');
            const iv = decode.substring(decode.length - 13).padEnd(16, '0');
            const encryptedDataHex = ciphertext.substring(ciphertext.indexOf("2324") + 4, ciphertext.length - 26);
            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(iv);
            const encryptedWords = CryptoJS.enc.Hex.parse(encryptedDataHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWords }, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) {
            console.error("Decrypt VOD Error:", e);
            return null;
        }
    }
    // ====================  ↑↑↑ 【归来计划】我们自己的VOD加密核心 (最终版) ↑↑↑ ====================

    // 【凤凰系统】的加解密核心 (保持能用的原样)
    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const dataWords = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataWords, keyHex, { iv: ivHex });
        return encrypted.toString();
    }
    function decryptAes(ciphertext, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");
    
    // VOD加密按钮，调用我们自己的、自给自足的复杂加密函数
    btnEncryptVod.addEventListener('click', () => { 
        const result = encryptVod(mainInput.value); 
        if (result) mainInput.value = result; else showToast('加密失败！'); 
    });
    // VOD解密按钮，调用我们自己的、与之配套的复杂解密函数
    btnDecryptVod.addEventListener('click', () => { 
        const r = decryptVod(mainInput.value); 
        if(r) mainInput.value = r; else showToast('解密失败！');
    });

    // 凤凰系统按钮保持原样
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    
    // MD5按钮暂时移除，因为它与我们的核心逻辑无关
    // btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});

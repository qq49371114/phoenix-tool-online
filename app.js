document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const mainInput = document.getElementById('main-input');
    const vodKeyInput = document.getElementById('vod-key-input');
    const vodIvInput = document.getElementById('vod-iv-input');
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');

    // --- 常量定义 (凤凰系统专用) ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 辅助函数 ---
    function showToast(message) { const toast = document.createElement('div'); toast.textContent = message; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; document.body.appendChild(toast); setTimeout(() => { document.body.removeChild(toast); }, 2000); }

    // ====================  ↓↓↓ VOD线路仓的核心逻辑 (婉儿最终修复版) ↓↓↓ ====================
    
    // 【保持不变】的辅助函数
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }

    /**
     * 【保持不变】为了兼容壳子，此加密函数不做任何修改
     */
    function encryptVod(data, keyString, ivString) {
        const key = processKeyToWords(keyString);
        const iv = processKeyToWords(ivString);
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        
        const keyHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(keyString));
        const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(ivString));

        return "2423" + keyHex + "2324" + encryptedHex + ivHex;
    }

    /**
     * 【婉儿重构版】在不改变加密格式的前提下，通过手动传入IV来修复解密
     */
    function decryptVod(ciphertext, ivString) {
        try {
            // 1. 检查基本格式
            if (!ciphertext.startsWith("2423") || !ciphertext.includes("2324")) {
                showToast("错误：密文格式不正确！");
                return null;
            }
            const separatorIndex = ciphertext.indexOf("2324");
            
            // 2. 提取Key的Hex和原文
            const keyHex = ciphertext.substring(4, separatorIndex);
            const keyString = CryptoJS.enc.Hex.parse(keyHex).toString(CryptoJS.enc.Utf8);
            
            // 3. 【核心修正】根据外部传入的ivString，动态计算出ivHex的真实长度
            const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(ivString));
            const ivHexLength = ivHex.length;

            // 4. 从密文末尾，按真实长度切割出ivHex和密文主体
            const bodyAndIvHex = ciphertext.substring(separatorIndex + 4);
            if (bodyAndIvHex.length < ivHexLength) {
                showToast("错误：密文已损坏！");
                return null;
            }
            const encryptedHex = bodyAndIvHex.substring(0, bodyAndIvHex.length - ivHexLength);

            // 5. 使用和加密时完全一致的逻辑，来生成用于解密的Key和IV
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);

            // 6. 执行解密
            const ciphertextWords = CryptoJS.enc.Hex.parse(encryptedHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedText) {
                showToast("解密失败，请检查Key/IV或密文是否正确。");
                return null;
            }
            return decryptedText;

        } catch (e) {
            console.error("解密时发生致命错误:", e);
            showToast("解密时发生致命错误，详见控制台。");
            return null;
        }
    }
    
    // ====================  ↑↑↑ VOD线路仓的核心逻辑 (婉儿最终修复版) ↑↑↑ ====================


    // 【凤凰系统】的加解密核心 (保持能用的原样)
    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const dataWords = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataWords, keyHex, { iv: ivHex });
        return encrypted.toString();
    }
    function decryptAes(ciphertext, key, iv) {
        try {
            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(iv);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return null;
        }
    }

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");
    
    // 【保持不变】加密按钮事件
    btnEncryptVod.addEventListener('click', () => { 
        const key = vodKeyInput.value;
        const iv = vodIvInput.value;
        if (!key || !iv) {
            showToast('请输入VOD的Key和IV！');
            return;
        }
        mainInput.value = encryptVod(mainInput.value, key, iv); 
    });

    // 【婉儿重构版】解密按钮事件
    btnDecryptVod.addEventListener('click', () => { 
        // 【核心修正】解密时，必须从输入框获取原始IV
        const iv = vodIvInput.value;
        if (!iv) {
            showToast('解密需要提供原始的IV！');
            return;
        }
        const r = decryptVod(mainInput.value, iv); 
        if(r) mainInput.value = r;
    });

    // 凤凰系统按钮保持原样
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
});

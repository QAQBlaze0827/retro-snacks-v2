// 集中管理前端 API 網址，避免散落在不同頁面。
(function () {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const defaultApiUrl = isLocal
        ? 'http://localhost:3000/api'
        : 'https://retro-snacks-v2.onrender.com/api';

    window.RETRO_SNACKS_CONFIG = {
        API_URL: window.RETRO_SNACKS_API_URL || defaultApiUrl
    };
})();

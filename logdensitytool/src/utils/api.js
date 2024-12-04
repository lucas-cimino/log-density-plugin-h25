const axios = require('axios');

async function Post(url, port, path, args) {
	const URL = `${url}:${port}`
	return await axios.post(URL + path, args, {
		headers: {
			'Content-Type': 'application/json',
		}
	});
}

async function Get(url, port, path, params) {
    /**
     * path : string of path ex: "/help"
     * params : map of params ex: {param1: "testing1", param2: 2}
     * will add params to url ex: http://localhost:8080/api?param1=testing1&param2=2
     */
	const URL = `${url}:${port}`
	let parameters = ""
	if (params != null && typeof params === 'object') {
        parameters = '?' + Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
	return await axios.get(URL + path + parameters);
}

module.exports = {
	Post, 
	Get
};
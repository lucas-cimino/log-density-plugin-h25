const axios = require('axios');

/**
 * API Post method
 * 
 * @param {string} url string of service url
 * @param {string} port string of service port
 * @param {string} path string of path ex: "/help"
 * @param {json} args json body for request
 * @returns API response
 */
async function post(url, port, path, args) {
	const URL = `${url}:${port}`
	try {
		const response = await axios.post(URL + path, args, {
			headers: {
				'Content-Type': 'application/json',
			}
		});
		// Check for non-200 status codes
		if (response.status !== 200) {
			throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
		}
		return response
	} catch (error) {
		handleError(error)
	}
}


/**
 * API Get method
 * 
 * @param {string} url string of service url
 * @param {string} port string of service port
 * @param {string} path string of path ex: "/help"
 * @param {json} params map of params ex: {param1: "testing1", param2: 2}
 * will add params to url ex: http://localhost:8080/api?param1=testing1&param2=2
 * @returns API response
 */
async function get(url, port, path, params) {
	try {
		const URL = `${url}:${port}`
		let parameters = ""
		if (params != null && typeof params === 'object') {
			parameters = '?' + Object.entries(params)
				.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
				.join('&');
		}
		const response = await axios.get(URL + path + parameters);
		// Check for non-200 status codes
		if (response.status !== 200) {
			throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
		}
		return response
	} catch (error) {
		handleError(error)
	}
	
}

function handleError(error) {
    if (error.response) {
        // The server responded with a status code outside 2xx range
		throw new Error(`Backend Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
        // The request was made but no response was received
        // console.error(`Request details: ${JSON.stringify(error.response.data, null, 2)}`);
		throw new Error('No response received from backend');
    } else {
        // Something went wrong while setting up the request
        // console.error('Error setting up request:', error.code);
		throw new Error('Request failed');
    }
}

module.exports = {
	post, 
	get
};
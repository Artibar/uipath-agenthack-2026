import axios from 'axios'

import * as cheerio from 'cheerio';

export const extractedUrlText = async(url)=>{
    try {
        const response = await axios.get(url)
        const $=cheerio.load(response.data);
        $("script").remove();
        $("style").remove();
        const text = $("body").text();
        return{
            text: text
            .replace(/\s+/g, " ")
            .trim()
        }
    } catch (error) {
        throw new Error (
            `URL Extraction Failed: ${error.message}`
        )
    }
}
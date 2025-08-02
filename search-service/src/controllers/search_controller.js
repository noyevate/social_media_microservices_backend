const { Search } = require("../models/Search");
const logger = require("../utils/looger")


const searchPostController = async(req, res) => {
    logger.info("Search endpoint hit..");
    try {
        const {query} = req.query;
        const  results = await Search.find(
            {
            $text: {$search: query}
        },
        {
            score: {$meta: 'textScore'}
        }
    ).sort({score: {$meta: "textScore"}})
    .limit(10);
    if (results < 1) {
        res.json({
            message: "No post found..."
        })
    }
    res.json(results)
    } catch (error) {
        logger.error('error occured while searching.', error);
        return res.status(500).json({
            success: false,
            message: "error occured while searching."
        });
    }
}

module.exports = {searchPostController}
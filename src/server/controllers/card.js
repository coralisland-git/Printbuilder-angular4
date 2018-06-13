module.exports = {
    // get template elements as json
    getTemplateElements(req, res) {
        let params = req.body;

        try {
            let elements = require(['../../resources/templates', params.sku, params.file_name + '.json'].join('/')).layers;

            res.status(200).send({ elements: elements });
        } catch (e) {
            res.status(400).send({ "message": "Not Found" });
        }
    }
}   
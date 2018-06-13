const allTemplates = require('../../resources/data.json');

module.exports = {
  searchTemplates(req, res) {
    if (Object.keys(req.body).indexOf("keyword") !== -1) {
      let keyword = req.body["keyword"].toLowerCase();

      let result = allTemplates.filter(template => {
        let found = false;

        if (template["title"].toLowerCase().indexOf(keyword) !== -1 ||
          template["subtitle"].toLowerCase().indexOf(keyword) !== -1)
          found = true;
        else {
          for (let category of template["categories"]) {
            if (!found)
              found = category.toLowerCase().indexOf(keyword) !== -1;
          }
        }

        if (found) {
          template["preview"] = "https://s3-us-west-1.amazonaws.com/agent-cloud/print-builder/templates/" + template["sku"] + "/jumbo-horizontal-front/preview.png";
          return true;
        }
        return false;
      });

      res.status(200).send(result.slice(0, 6));
    } else {
      res.status(404).send({
        "message": "No keyword provided"
      });
    }
  }
};

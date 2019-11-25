const sharp = require("sharp");
const axios = require("axios");
const dotenv = require("dotenv").config();
const path = require("path");
const fs = require("fs");

access_key = process.env.access_key || "YOUR ACCESS KEY";
secret_key = process.env.secret_key || "YOUR SECRET KEY";

const baseURL = "https://api.unsplash.com";
const meta = JSON.parse(fs.readFileSync("./imgMeta.json", "utf8"));

const authHeader = {
  Authorization: `Client-ID ${access_key}`
};

const scrapeImages = async (query = "city", items = 32) => {
  try {
    imgs = [];
    let page = 1;

    while (imgs.length < items) {
      res = await axios.get(`${baseURL}/search/photos/`, {
        params: {
          query,
          page,
          per_page: "30",
          orientation: "portrait"
        },
        headers: authHeader
      });

      res.data.results.map(img => {
        if (imgs.length < items) {
          imgs.push({
            id: img.id,
            url: img.urls.raw,
            name: img.user.name,
            instagram: img.user.instagram_username || undefined
          });
        }
      });
      page++;
    }

    return imgs;
  } catch (e) {
    console.log(e);
  }
};

const downloadImages = async (imgs = []) => {
  for (let img of imgs) {
    const files = fs.readdirSync(
      `C:/Users/janni/Documents/GitHub/Downsplash/imgs`
    );

    let imgPath = path.resolve(__dirname, "../imgs", `${img.id}.jpg`);

    if (files.indexOf(`${img.id}.jpg`) == -1) {
      let writer = fs.createWriteStream(imgPath);

      let res = await axios.get(img.url, { responseType: "stream" });
      res.data.pipe(writer);

      writer.on("finish", () => {});
      writer.on("error", () => {});

      meta.imgs.push({
        id: img.id,
        file: `./imgs/${img.id}.jpg`,
        instagram: img.instagram || undefined,
        name: img.name
      });
    }
  }

  fs.writeFileSync("./imgMeta.json", JSON.stringify(meta));
};

const resizeImages = imgs => {
  for (let img of imgs) {
    let image = sharp(`./imgs/${img.id}.jpg`);
    image.resize(1080, 1350).toFile(`./imgs/resized/${img.id}.jpg`);
  }
};

(async () => {
  let imgs = await scrapeImages("citys", 10);
  await downloadImages(imgs);

  // resizeImages(imgs);

  console.log(
    "Finished downloading your images! The metadata is stored inside imgMeta.json. \nCheers mate."
  );
})();

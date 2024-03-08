const { Router } = require("express");
const TrayItem = require("../models/TrayItem");
const Plant = require("../models/Plant");
const router = Router();

const fs = require("fs/promises");
const { loadImage, createCanvas } = require("canvas");
const cups = require("node-cups");
const QRCode = require("qrcode");

const createQr = (path, id) => {
  return new Promise((resolve, reject) => {
    QRCode.toFile(
      path,
      id,
      {
        width: 75,
        height: 75,
        margin: 2,
      },
      (err) => {
        if (err) reject(err);
        resolve("QR code created");
      }
    );
  });
};

const printPlants = async (plants) => {
  console.log("printPlants: plants", plants);

  try {
    const tray = await Promise.all(
      plants.map(
        async (id) =>
          await Plant.findById(id)
            .then((plant) => {
              return {
                id: plant._id,
                strain: plant.strain,
                pheno: plant.pheno,
                type: plant.type,
                code: parseInt(
                  plant._id.toString().slice(-4).toUpperCase(),
                  16
                ),
                start:
                  plant.actions.length > 0
                    ? plant.actions[0].date.toDateString()
                    : "none",
                qr: "./qr/" + plant._id + ".png",
              };
            })
            .catch((err) => {
              return { error: err.message };
            })
      )
    );
    console.log("tray: ", tray);

    const qrs = await Promise.all(
      tray.map((plant) => {
        return createQr(plant.qr, plant.id);
      })
    );
    console.log("Qrs", qrs);

    if (qrs.length === tray.length) console.log("QR codes created");

    const myPDFcanvas = createCanvas(142, 85, "pdf");
    console.log("Canvas created");

    const ctx = myPDFcanvas.getContext("2d");

    tray.forEach(async (plant, index) => {
      if (index > 0) {
        ctx.addPage(142, 85);
      }
      const img = await loadImage(plant.qr);
      ctx.drawImage(img, 66, 2, 75, 75);
      ctx.font = "bold 22px Arial ";
      ctx.fillText(plant.pheno, 3, 20, 64);
      ctx.font = " 12px Arial ";
      ctx.fillText(plant.strain, 3, 30, 52);
      ctx.font = "8px Arial ";
      ctx.fillText(plant.type, 3, 40, 52);
      ctx.font = "10px Arial ";
      ctx.fillText("start:" + plant.start, 3, 55, 62);
      ctx.font = "bold 16px Arial";
      ctx.fillText(plant.code, 13, 70, 62);

      console.log("Page#", index, "created");
    });
    // fs.rm(qrCodeImagePath).then(() => {
    //   console.log("QR code removed");
    // });

    const printerNames = await cups.getPrinterNames();
    console.log(printerNames);
    const options = {
      destination: printerNames[0],
      jobTitle: "Label Printing",
      copies: 1,
    };

    myPDFcanvas.toBuffer("application/pdf").then((buff) => {
      fs.writeFile("label.pdf", buff).then(() => {
        cups.printFile("label.pdf", options, (err, jobID) => {
          if (err) {
            console.error(err);
            res.status(500).send("Ошибка при печати этикетки");
          } else {
            console.log(
              `Этикетка успешно отправлена на печать. Job ID: ${jobID}`
            );
            res.send("Этикетка успешно отправлена на печать.");
          }
        });
      });
    });

    return tray;
  } catch (error) {
    return error;
  }
};

router.post("/print_tray", async (req, res) => {
  try {
    const data = await TrayItem.find({}, "plantId").exec();
    const plants = data.map((plant) => plant.plantId);
    const result = await printPlants(plants);

    res.json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.post("/print_plants", async (req, res) => {
  const plants = req.body;
  if (plants?.length < 1) {
    return res.status(500).json({ message: "Nothing for printing" });
  }
  try {
    const result = await printPlants(plants);

    res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

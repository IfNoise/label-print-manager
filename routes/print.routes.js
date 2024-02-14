const { Router } = require("express");
const TrayItem = require("../models/TrayItem");
const Plant = require("../models/Plant");
const router = Router();
const fs = require("fs");
const { Image, createCanvas } = require("canvas");
const cups = require("node-cups");
const QRCode = require("qrcode");

const printPlants = async (plants) => {
  console.log('printPlants: plants', plants)
  
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
                start:
                  plant.actions.length > 0
                    ? plant.actions[0].date.toDateString()
                    : "none",
              };
            })
            .catch((err) => {
              return { error: err.message };
            })
      )
    );
    await Promise.all(
      tray.map(async (plant) => {
        const id = plant.id.toString();
        const qrCodeImagePath = "./qr/" + id + ".png";
        QRCode.toFile(qrCodeImagePath, id, {
          width: 75,
          height: 75,
          margin: 2,
        });
      })
    );
    const myPDFcanvas = createCanvas(142, 85, "pdf");
    const ctx = myPDFcanvas.getContext("2d");
    tray.forEach((plant) => {
      const id = plant.id.toString();
      const qrCodeImagePath = "./qr/" + id + ".png";
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 66, 5, 75, 75);
        ctx.font = "bold 22px Arial ";
        ctx.fillText(plant.pheno, 3, 20, 64);
        ctx.font = " 12px Arial ";
        ctx.fillText(plant.strain, 3, 30, 52);
        ctx.font = "8px Arial ";
        ctx.fillText(plant.type, 3, 40, 52);
        ctx.font = "10px Arial ";
        ctx.fillText("start:" + plant.start, 3, 55, 62);
        ctx.addPage(142, 85);
        fs.rm(qrCodeImagePath, (err) => {
          console.log(err);
        });
      };
      img.onerror = (error) => {
        console.error("Error loading image:", error);
      };
      img.src = qrCodeImagePath;
      
    });
    const buff = myPDFcanvas.toBuffer("application/pdf");
    fs.writeFile("label.pdf", buff, function (err) {
      if (err) throw err;

      console.log("created label.pdf");
    });
    const printerNames = await cups.getPrinterNames();
    console.log(printerNames);
    const options = {
      destination: printerNames[0],
      jobTitle: "Label Printing",
      copies: 1,
    };
    cups.printFile("label.pdf", options, (err, jobID) => {
      if (err) {
        console.error(err);
        res.status(500).send("Ошибка при печати этикетки");
      } else {
        console.log(`Этикетка успешно отправлена на печать. Job ID: ${jobID}`);
        res.send("Этикетка успешно отправлена на печать.");
      }
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
  const  plants  = req.body;
  if (plants?.length < 1) {
    return res.status(500).json({ message: "Nothing for printing" });
  }
  try {
    const result = printPlants(plants);

    res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

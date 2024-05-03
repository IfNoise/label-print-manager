module.exports = {
  apps : [{
    name   : "label_printer_manager",
    script : "./app.js",
     env_production: {
       NODE_ENV: "production"
    },
    env_development: {
       NODE_ENV: "development"
    }
  }]
}

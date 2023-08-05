//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
const mongoDB = "mongodb://127.0.0.1:27017/todolistDB";
mongoose.connect(mongoDB);

// Event listeners to check connection status
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB!");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
});

const itemSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];
const day = date.getDate();

app.get("/", async function (req, res) {
  const items = await Item.find({});

  if (items.length === 0) {
    Item.insertMany(defaultItems);
  }

  res.render("list", { listTitle: day, newListItems: items });
});

// Express Dynamic Route
app.get("/:customListName", async (req, res) => {
  const customListName = req.params.customListName;



  const foundItem = await List.findOne({ name: customListName });
  if (!foundItem) {
    // Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/"+customListName)
  } else {
    // Show an existing list
    res.render("list",{ listTitle: customListName, newListItems: foundItem.items })
  }

  
});

app.post("/", async (req, res)=> {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(req.body)
  const newItem = new Item({
    name: itemName,
  });

  if(listName === day){
    newItem.save();
    res.redirect("/");

  } else{
      const foundlist = await List.findOne({name:listName});
      console.log(foundlist)
      foundlist.items.push(newItem);
      foundlist.save();
      res.redirect("/"+listName);
  }

});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body["checkbox"];
  const listName = req.body.listName;

  if(listName === day){
    const deletedItem = await Item.findByIdAndDelete(checkedItemId);
    if (deletedItem) {
      console.log("Item deleted successfully:", deletedItem);
    } else {
      console.log("Item not found.");
    }
  
    res.redirect("/");

  } else{
    const updatedItem = await List.findOneAndUpdate(
      { name: listName }, // Query to find the document
      { $pull: {items: {_id: checkedItemId}} }, // Update operation using $pull
      { new: true } // Return the modified document (default is the original document)
    );

    if (updatedItem) {
      console.log('Updated item:');
      console.log(updatedItem);
      res.redirect("/"+listName);
    } else {
      console.log('Item not found.');
    }
  }


});


// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

// app.get("/about", function (req, res) {
//   res.render("about");
// });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const lodash = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });
mongoose.connect("mongodb+srv://bschall19:Test123@cluster0.uwrkbww.mongodb.net/todolistDB", { useNewUrlParser: true });
// /?retryWrites=true&w=majority



//*******************ITEMS******************
const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



//*******************NEW PAGE LIST******************
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


//*******************SET UP MAIN PAGE******************
app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else { console.log("Successfully saved default items to DB.") }
      });
      res.redirect("/");
    }
    else { res.render("list", { listTitle: "Today", newListItems: foundItems }); }
  });
});



//*******************SET UP EXTRA PAGE******************
app.get("/:customListName", function (req, res) {
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    }
    else {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect(`/${customListName}`)
      }
      else {
        //Show an existing list}
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});



//*******************SAVE ONE ENTRY******************
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  //Keep added task to page that is selected and not redirect back home and add it to home.
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save()
      res.redirect(`/${listName}`);
    });
  }

});


//*******************DELETE ONE ENTRY******************
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
  Item.findByIdAndRemove(checkedItemId, function (err) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("Item successfully deleted from DB.");
      res.redirect("/");
    }
  });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect(`/${listName}`)
      }
    })
  }
});



app.get("/about", function (req, res) {
  res.render("about");
});

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000.");
});

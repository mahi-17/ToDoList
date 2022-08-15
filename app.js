const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");



const app = express();
app.set("view engine", 'ejs'); //  we need to initialize before the app 
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var addedItems = ["buy foot items", "cook the food"];
var workItems = [];

// const port = 3000;

mongoose.connect("mongodb+srv://admin:admin123@cluster0.eq6cpt6.mongodb.net/todolistDB", { useNewUrlParser: true });
// creating the database schema
const itemSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "welcom to your to do list"
})
const item2 = new Item({
    name: "Hit the + button to add new item."
})
const item3 = new Item({
    name: "<-- click the check list to delete"
})
const defaultItems = [item1, item2, item3]

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

    let day = date();
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            // console.log("i am inside")
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("succesfully saved DB")
                }
            })
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today", newListItems: foundItems
            });
        }
    })

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    // const customListName =(req.params.customListName);
    // console.log(customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list 
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/" + customListName);
            } else {
                //show an exsisting list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })
})


app.post("/", function (req, res) {
    // adding new items to todolist data base
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {

        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

app.post("/delete", function (req, res) {
    // console.log(req.body.checkbox);
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                // console.log("seccesfully removed");
                res.redirect("/");
            }
        })
    } else {
        // using the mogos remove document using the pull 
        // remove a document from the collections
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }
})
app.get("/about", function (req, res) {
    res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
    console.log("server started on port " + port);
})
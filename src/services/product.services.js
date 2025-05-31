import axios from "axios";

const getProduct = () => {
    axios
    .get("http://localhost:4000/")
    .then((res) => {
        console.log(res);
    })
    .catch((err) => {
        console.log(err);
});

};
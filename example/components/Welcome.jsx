import { Button } from "@/components/Button";
import { useState } from "@/msga/msga.js";

export const Welcome = ({ text }) => {
    const f = [
        "Apple",
        "Banana",
        "Orange",
        "Mango",
        "Pineapple",
        "Strawberry",
        "Blueberry",
        "Raspberry",
        "Watermelon",
        "Cantaloupe",
        "Kiwi",
        "Papaya",
        "Grapes",
        "Cherry",
        "Peach",
        "Plum",
        "Pomegranate",
        "Lemon",
        "Lime",
        "Apricot",
        "That's all folks!"
    ];

    const [counter, setCounter] = useState(0);
    const [fruits, setFruits] = useState([]);

    const incrementCounter = () => {
        setFruits([...fruits, f[counter]]);
        setCounter(counter + 1);
    }

    return (
        <div class="bg-stone-900 w-screen h-screen flex flex-row justify-evenly items-center">
            <div class="flex flex-col justify-center items-center">
                <h1 class="text-yellow-400 text-2xl">Fruits</h1>
                {
                    fruits.map((fruit, i) => <p class="text-white italic transform transition duration-300 ease-out" style={{ animation: `pop 0.3s ease-out ${i * 0.05}s forwards` }}>{fruit}</p>)
                }
            </div>
            <div class="flex flex-col justify-center items-center">
                <h1 class="text-3xl text-white self-center">From app.jsx 🔥</h1>
                <div class="flex flex-row gap-2 justify-center items-center p-2">
                    <p class="text-md italic text-gray-200">Make Static</p>
                    <Button onClick={incrementCounter}>{text}</Button>
                    <p class="text-md italic text-gray-200">Great Again</p>
                </div>
                <h1 class="text-white text-2xl flex flex-row gap-2">Click counter: <h1 class="text-yellow-400 text-2xl">{counter}</h1></h1>
            </div>
        </div>
    )
}
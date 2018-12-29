
import {hexPad} from "./utils.js";
import ProtobufParser from "./protobuf-parser.js";

class App {

    constructor () {
        this.initialize();
    }

    /** @return {void} */
    async initialize() {
        const data = await App.downloadData();
        const messages = App.obtainMessageList(data);
        const message = messages[0];

        this.renderMessage(message, document.body);
    }

    /**
     * @param {DataView} message
     * @param {HTMLElement} parentContainer
     */
    renderMessage(message, parentContainer) {
        const parser = new ProtobufParser();
        parser.parse(message);

        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message");

        for (const field of parser.fields) {
            const fieldContainer = document.createElement("div");
            fieldContainer.classList.add("message-field");

            const bytesContainer = document.createElement("div");
            bytesContainer.classList.add("bytes");
            for (let i = field.beginPos; i < field.endPos; i++) {
                const byteElem = document.createElement("div");
                byteElem.classList.add("byte");
                byteElem.innerText = hexPad(message.getUint8(i));
                bytesContainer.appendChild(byteElem);
            }
            fieldContainer.appendChild(bytesContainer);
            const description = document.createElement("div");
            description.innerText = field.description;
            fieldContainer.appendChild(description);

            messageContainer.appendChild(fieldContainer);
            messageContainer.appendChild(document.createElement("break"));
        }

        const previousContainer = document.querySelector(".bytes");
        previousContainer && previousContainer.remove();
        parentContainer.appendChild(messageContainer);
    }

    /**
     * @param {DataView} data
     * @return {DataView[]}
     */
    static obtainMessageList(data) {
        let pos = 0;
        let count = 0;
        let list = [];
        while (pos < data.byteLength) {
            const size = data.getUint16(pos, false); pos += 2;
            list.push(new DataView(data.buffer, pos, size));
            pos += size;
            count++;
        }
        console.info(`Found ${count} messages`);
        return list;
    }

    /**
     * @return {Promise<DataView>}
     */
    static async downloadData() {
        const response = await fetch("./sample.bin");
        if (response.ok) {
            return new DataView(await response.arrayBuffer());
        }
        console.error("Fetch failed");
        return null;
    }
}

new App();

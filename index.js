
import {hexPad} from "./utils.js";
import ProtobufParser from "./protobuf-parser.js";

class App {

    constructor () {
        this.titleElem = document.getElementById("title");
        this.messageContainerElem = document.getElementById("message-container");

        this.initialize();
        /** @tyoe {DataView[]} */
        this.messages = [];
        this.selectedMessageIndex = 0;

        window.addEventListener("keypress", this.keypress.bind(this));
    }

    keypress(event) {
        switch (event.key) {
            case ".": {
                const previousIndex = this.selectedMessageIndex;
                const newIndex = Math.min(this.selectedMessageIndex + 1, this.messages.length - 1);
                if (newIndex !== previousIndex) {
                    this.selectedMessageIndex = newIndex;
                    this.render();
                }
                break;
            }
            case ",": {
                const previousIndex = this.selectedMessageIndex;
                const newIndex = Math.max(this.selectedMessageIndex - 1, 0);
                if (newIndex !== previousIndex) {
                    this.selectedMessageIndex = newIndex;
                    this.render();
                }
                break;
            }
        }
    }

    /** @return {void} */
    async initialize() {
        const data = await App.downloadData();
        this.messages = App.obtainMessageList(data);
        this.render();
    }

    render() {
        this.titleElem.innerText = `Message ${this.selectedMessageIndex} of ${this.messages.length}`;
        this.messageContainerElem.innerHTML = "";
        this.renderMessage(this.messages[this.selectedMessageIndex]);
    }

    /**
     * @param {DataView} message
     * @param {HTMLElement} parentContainer
     */
    renderMessage(message, parentContainer = this.messageContainerElem) {
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

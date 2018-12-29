
import {hexPad} from "./utils.js";
import ProtobufParser from "./protobuf-parser.js";

class App {

    constructor () {
        this.initialize();
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

    /** @return {void} */
    async initialize() {
        const data = await App.downloadData();
        const message = App.obtainMessageList(data);
        const firstMessage = message[0];

        const parser = new ProtobufParser();
        parser.parse(firstMessage);

        const container = document.createElement("div");
        container.classList.add("bytes");

        let group = null;

        for (let i = 0; i < firstMessage.byteLength; i++) {
            if (parser.fieldPositions.has(i)) {
                if (group) {
                    container.appendChild(group);
                    container.appendChild(document.createElement("break"));
                }
                group = document.createElement("div");
                group.classList.add("byte-group");
            }
            const byteElem = document.createElement("div");
            byteElem.innerText = hexPad(firstMessage.getUint8(i));
            group.appendChild(byteElem);
        }
        if (group) {
            container.appendChild(group);
            container.appendChild(document.createElement("break"));
        }

        const previousContainer = document.querySelector(".bytes");
        previousContainer && previousContainer.remove();
        document.body.appendChild(container);
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

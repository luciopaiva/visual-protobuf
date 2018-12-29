
const FIELD_TYPES = new Map();
FIELD_TYPES.set(0, "varint");
FIELD_TYPES.set(1, "double");
FIELD_TYPES.set(2, "length-delimited");
FIELD_TYPES.set(3, "start-group");
FIELD_TYPES.set(4, "end-group");
FIELD_TYPES.set(5, "float");


export default class ProtobufParser {

    constructor () {
        /** @type {DataView} */
        this.message = null;
        this.pos = 0;
        this.fieldPositions = new Set();
    }

    hasMoreData() {
        return this.message && this.pos < this.message.byteLength;
    }

    readByte() {
        return this.message.getUint8(this.pos++);
    }

    /**
     * @return {BigInt}
     */
    readVarInt() {
        let b;
        let exponent = 0n;
        let result = 0n;
        do {
            b = this.readByte();
            result += BigInt(b & 0x7f) * 2n ** exponent;
            exponent += 7n;
        } while (!!(b & 0x80));
        return result;
    }

    readTag() {
        const tag = this.readVarInt();
        const fieldNumber = Number(tag >> 0x03n);
        const fieldType = Number(tag & 0x03n);
        return [fieldNumber, fieldType];
    }

    readValue(fieldType) {
        switch (fieldType) {
            case 0: // varint
                return this.readVarInt();
            // case 1: // double
            //     break;
            case 2:
                const size = Number(this.readVarInt());
                this.pos += size;
                return size;
            default:
                throw new Error("Unknown field type " + fieldType);
        }
    }

    readField() {
        this.fieldPositions.add(this.pos);
        const [fieldNumber, fieldType] = this.readTag();
        const value = this.readValue(fieldType);
        console.info(`Field id:${fieldNumber}, type ${FIELD_TYPES.get(fieldType)}, value ${value}`);
    }

    /**
     * @param {DataView} message
     */
    parse(message) {
        this.message = message;
        this.pos = 0;

        try {
            while (this.hasMoreData()) {
                this.readField();
            }
        } catch (e) {
            console.error(e);
        }

        console.info(this.fieldPositions);
    }
}

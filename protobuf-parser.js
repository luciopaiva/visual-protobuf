
const FIELD_TYPES = new Map();
FIELD_TYPES.set(0, "varint");
FIELD_TYPES.set(1, "double");
FIELD_TYPES.set(2, "length-delimited");
FIELD_TYPES.set(3, "start-group");
FIELD_TYPES.set(4, "end-group");
FIELD_TYPES.set(5, "float");

class ProtobufField {
    constructor (id, type, value, beginPos, endPos, tagSize, valueSize) {
        this.id = id;
        this.type = type;
        this.value = value;
        this.beginPos = beginPos;
        this.endPos = endPos;
        this.tagSize = tagSize;
        this.valueSize = valueSize;
        this.description = this.makeDescription();
    }

    makeDescription() {
        switch (this.type) {
            case 0:
                return `id: ${this.id}, type: ${ProtobufParser.FIELD_TYPES.get(this.type)}, ` +
                    `tagSize: ${this.tagSize}, ` +
                    `valueSize: ${this.valueSize}, ` +
                    `value: ${this.value} (0x${this.value.toString(16)})`;
            case 1:
            case 5:
                return `id: ${this.id}, type: ${ProtobufParser.FIELD_TYPES.get(this.type)}, ` +
                    `tagSize: ${this.tagSize}, ` +
                    `valueSize: ${this.valueSize}, ` +
                    `value: ${this.value}`;
            default:
                return `id: ${this.id}, type: ${ProtobufParser.FIELD_TYPES.get(this.type)}, ` +
                    `tagSize: ${this.tagSize}, ` +
                    `valueSize: ${this.valueSize} `;
        }
    }
}

export default class ProtobufParser {

    constructor() {
        /** @type {DataView} */
        this.message = null;
        this.pos = 0;
        this.end = 0;
        /** @type {ProtobufField[]} */
        this.fields = [];
    }

    hasMoreData() {
        return this.pos < this.end;
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
        const fieldType = Number(tag & 0x07n);
        return [fieldNumber, fieldType];
    }

    readValue(fieldType) {
        switch (fieldType) {
            case 0:  // varint
                return this.readVarInt();
            case 1:  // double
                const doubleValue = this.message.getFloat64(this.pos, true);
                this.pos += 8;
                return doubleValue;
            case 2:  // length-delimited, string, byte array
                const size = Number(this.readVarInt());
                // ToDo may fail if this is a string or byte array - identify and handle those cases accordingly
                const parser = new ProtobufParser();
                parser.parse(this.message, this.pos, this.pos + size);
                this.pos += size;
                return parser;
            case 5:  // float
                const floatValue = this.message.getFloat32(this.pos, true);
                this.pos += 4;
                return floatValue;
            default:
                throw new Error("Unknown field type " + fieldType);
        }
    }

    readField() {
        const beginPos = this.pos;
        const [fieldNumber, fieldType] = this.readTag();
        const tagSize = this.pos - beginPos;
        const value = this.readValue(fieldType);
        const valueSize = this.pos - beginPos - tagSize;
        this.fields.push(new ProtobufField(fieldNumber, fieldType, value, beginPos, this.pos, tagSize, valueSize));
    }

    /**
     * @param {DataView} message
     * @param {Number} begin
     * @param {Number} end
     */
    parse(message, begin = 0, end = message.byteLength) {
        this.message = message;
        this.pos = begin;
        this.end = end;

        try {
            while (this.hasMoreData()) {
                this.readField();
            }
        } catch (e) {
            console.error(e);
        }
    }

    static get FIELD_TYPES() {
        return FIELD_TYPES;
    }
}

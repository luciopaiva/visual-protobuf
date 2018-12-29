
# Visual Protobuf

Visual Protobuf (VP) is a tool to visually inspect bytes in a protobuf message.

Most information going in a protobuf message can be inferred without the need for definition files. This tool parsers the message only by inspecting its bytes.

A protobuf message is just a series of key-value pairs. Each key contains the field number and type. The field number is the number that appears in the protobuf definitions files for that specific protocol. The type is one of:

* 0: varint
* 1: double, fixed64
* 2: length-delimited
* 5: float, fixed32

The key is actually a varint per se. The decoded integer is then analyzed further to collect field type (3 least significant bits) and field number (the rest).

## Input file

VP accepts as input a binary file containing a series of protobuf messages. Each message follows the format:

* message size (16-bit big endian integer)
* message bytes (`message size` bytes long)

There's no header or footer in the file; just a series of `message size, message bytes` pairs.

## Limitations

Although most information can be inferred, some things have to be guessed:

* type 2 can be either a UTF8 string, an array of bytes or a sub-message. Currently VP just assumes it's a sub-message and proceeds to parsing it;

* type 1 can be either a double or a fixed 64-bit integer, but VP assumes it's a double;

* type 5 can be either a float or a fixed 32-bit integer, but VP assumes it's a float;

* varint values can be encoded using zig-zag encoding, but there's now way to know that from the message bytes, so VP just assumes it's not.

/** The fixed-size block every AC1009 file opens with: signature, section
 *  locators and the drawing-variables run, with the UCS/VPORT/APPID/
 *  DIMSTYLE/VX table directories embedded at fixed offsets inside it.
 *  Bytes [0, 0x6BD); a CRC16 and the entities sentinel follow it, so the
 *  first entity always starts at 0x6CF. */
export declare const HEADER_TEMPLATE: Uint8Array;
/** One '*ACTIVE' VPORT record at its defaults (251 bytes, CRC excluded).
 *  The writer overwrites the view height and centre. */
export declare const VPORT_TEMPLATE: Uint8Array;
/** Section begin sentinels. These sixteen-byte markers are the same in
 *  every AC1009 file ever written — they are how a reader finds a section
 *  when the locator table is damaged. Each section's end sentinel is the
 *  bitwise complement of its begin sentinel. */
export declare const SENTINELS: {
    readonly entities: 'c46e6854f86e3330633ec1852adc9401';
    readonly BLOCK: 'dbefb3f0c73e6da6c9b6245c4c6f32cb';
    readonly LAYER: '0ec4646fbb1dd38b0049c2ef18ea6ffb';
    readonly STYLE: 'e23ec182439f617750abc76696000618';
    readonly LTYPE: 'ac901aca1cbd951516164c14ce1888af';
    readonly VIEW: 'c13caa5668f4b41e4b74f408424dbfa5';
    readonly UCS: '604afa3d8490cc5befe7d6a57f1e61cd';
    readonly VPORT: 'f6ed44612adce47b4eb92bbb6660638d';
    readonly APPID: 'e125c25036686c0c3bd35d56c1791c3a';
    readonly DIMSTYLE: 'b4183e42c99fffe5b6e2cbb375c3c3b0';
    readonly VX: 'e0ca367ccee7586f2b7d745505f1447f';
    readonly blocks: '722b7dec3e8c886c7a720afdc86c8426';
    readonly extras: 'd5f9d3bb0aa969a6cd1c87c7ee804b17';
    readonly second: '298dd149a9731fea99de32f94d0ae019';
};

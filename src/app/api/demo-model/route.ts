import { NextResponse } from "next/server";
import { solidPng } from "@/lib/png";

export const dynamic = "force-dynamic";

type Vec3 = [number, number, number];

// Unit-cube faces, vertices wound counter-clockwise when viewed from outside.
const FACES: { n: Vec3; pts: Vec3[] }[] = [
  { n: [1, 0, 0], pts: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
  { n: [-1, 0, 0], pts: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]] },
  { n: [0, 1, 0], pts: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, -1, 0], pts: [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]] },
  { n: [0, 0, 1], pts: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], pts: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
];

function buildBoxGlb(dims: Vec3, color: Vec3): Buffer {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  FACES.forEach((face, fi) => {
    const base = fi * 4;
    face.pts.forEach((p) => {
      positions.push((p[0] * dims[0]) / 2, (p[1] * dims[1]) / 2, (p[2] * dims[2]) / 2);
      normals.push(...face.n);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  const minX = -dims[0] / 2;
  const maxX = dims[0] / 2;
  const minY = -dims[1] / 2;
  const maxY = dims[1] / 2;
  const minZ = -dims[2] / 2;
  const maxZ = dims[2] / 2;

  const positionView = new Float32Array(positions);
  const normalView = new Float32Array(normals);
  const indexView = new Uint16Array(indices);

  const posBytes = positionView.byteLength; // 24 * 12
  const normalBytes = normalView.byteLength;
  const indexBytes = indexView.byteLength;
  const binLength = posBytes + normalBytes + indexBytes;

  const json = {
    asset: { version: "2.0", generator: "ar-table-menu demo" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [color[0], color[1], color[2], 1],
          metallicFactor: 0,
          roughnessFactor: 0.9,
        },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positionView.length / 3,
        type: "VEC3",
        max: [maxX, maxY, maxZ],
        min: [minX, minY, minZ],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normalView.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: indexView.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes },
      { buffer: 0, byteOffset: posBytes, byteLength: normalBytes },
      {
        buffer: 0,
        byteOffset: posBytes + normalBytes,
        byteLength: indexBytes,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: binLength }],
  };

  const jsonString = JSON.stringify(json);
  const paddedJson = Buffer.from(jsonString, "utf8");
  const jsonPadding = (4 - (paddedJson.length % 4)) % 4;
  const jsonChunkLength = paddedJson.length + jsonPadding;

  const binChunkLength = ((binLength + 3) & ~3);

  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;
  const out = Buffer.alloc(totalLength);

  let offset = 0;
  out.writeUInt32LE(0x46546c67, offset); // "glTF"
  out.writeUInt32LE(2, offset + 4);
  out.writeUInt32LE(totalLength, offset + 8);
  offset += 12;

  out.writeUInt32LE(jsonChunkLength, offset);
  out.writeUInt32LE(0x4e4f534a, offset + 4); // "JSON"
  offset += 8;
  Buffer.from(jsonString, "utf8").copy(out, offset);
  if (jsonPadding) out.fill(0x20, offset + paddedJson.length, offset + jsonChunkLength);
  offset += jsonChunkLength;

  out.writeUInt32LE(binChunkLength, offset);
  out.writeUInt32LE(0x004e4942, offset + 4); // "BIN"
  offset += 8;
  Buffer.from(positionView.buffer, positionView.byteOffset, positionView.byteLength).copy(out, offset);
  offset += posBytes;
  Buffer.from(normalView.buffer, normalView.byteOffset, normalView.byteLength).copy(out, offset);
  offset += normalBytes;
  Buffer.from(indexView.buffer, indexView.byteOffset, indexView.byteLength).copy(out, offset);

  return out;
}

function hexToRgb(hex: string): Vec3 {
  const clean = hex.replace(/^#/, "");
  const value = Number.parseInt(clean, 16);
  if (Number.isNaN(value) || clean.length !== 6) return [0.71, 0.35, 0.35];
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
  ];
}

const SHAPES: Record<string, Vec3> = {
  plate: [0.18, 0.02, 0.18],
  cup: [0.07, 0.13, 0.07],
  bowl: [0.15, 0.07, 0.15],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shapeName = url.searchParams.get("shape") ?? "plate";
  const shape: Vec3 = SHAPES[shapeName] ?? SHAPES.plate;
  const color = hexToRgb(url.searchParams.get("color") ?? "e05252");

  if (url.searchParams.get("thumb") === "1") {
    return new NextResponse(new Uint8Array(solidPng(color)), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  }

  const glb = buildBoxGlb(shape, color);
  return new NextResponse(new Uint8Array(glb), {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
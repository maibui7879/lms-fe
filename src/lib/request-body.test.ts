// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { BodyTooLarge, readBody } from "./request-body";

function request(body?: string, length?: string) {
  return new Request("http://local.test", {
    method: "POST",
    body,
    headers: length === undefined ? {} : { "content-length": length },
  });
}

describe("bounded request bodies", () => {
  it("accepts an empty body and the exact byte limit", async () => {
    expect(await readBody(request(), 0)).toEqual(new Uint8Array());
    expect(new TextDecoder().decode(await readBody(request("abc"), 3))).toBe(
      "abc",
    );
  });
  it.each(["-1", "invalid", "1.5", "100"])(
    "rejects invalid or oversized content length %s",
    async (length) => {
      await expect(readBody(request("a", length), 3)).rejects.toBeInstanceOf(
        BodyTooLarge,
      );
    },
  );
  it("counts UTF-8 bytes even when content length is dishonest", async () => {
    await expect(readBody(request("éé", "1"), 3)).rejects.toBeInstanceOf(
      BodyTooLarge,
    );
  });
  it("cancels an overflowing stream and releases its lock", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
      },
      cancel,
    });
    await expect(
      readBody({ headers: new Headers(), body: stream } as Request, 3),
    ).rejects.toBeInstanceOf(BodyTooLarge);
    expect(cancel).toHaveBeenCalledOnce();
    expect(stream.locked).toBe(false);
  });
  it("joins chunks without changing their order", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    expect(
      await readBody({ headers: new Headers(), body: stream } as Request, 3),
    ).toEqual(new Uint8Array([1, 2, 3]));
  });
});

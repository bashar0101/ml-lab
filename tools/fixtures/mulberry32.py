"""Python port of src/engine/random.ts (mulberry32), bit-for-bit."""

M = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M


def mulberry32(seed):
    state = [seed & M]

    def rand():
        state[0] = (state[0] + 0x6D2B79F5) & M
        t = state[0]
        t = _imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & M)) & M
        return ((t ^ (t >> 14)) & M) / 4294967296

    return rand


def shuffled(n, rand):
    """Fisher-Yates, same as the TypeScript lesson code."""
    order = list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(rand() * (i + 1))
        order[i], order[j] = order[j], order[i]
    return order

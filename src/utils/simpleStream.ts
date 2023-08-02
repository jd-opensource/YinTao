export const createSimpleStream = () => {
    return {
        data: '',

        writable: true,

        pipe: () => {},

        _write (val) {
            this.data += val
        },

        _writableState: {},

        write (val) {
            this._write(val)
        },
        end (val) {
            if (val === void 0)
                return

            this._write(val)
        }
    }
}
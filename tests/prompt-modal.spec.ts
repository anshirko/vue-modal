import {mount} from "@vue/test-utils";
import {container, promptModal} from "../src/index";
import ModalPromptValue from "./components/modal-prompt-value.vue";
import wait from "./wait";
import NamespaceStore from "./../src/utils/NamespaceStore";

beforeEach(async () => {
    NamespaceStore.instance.forceClean()
    await wait()
})

describe("Testing prompt-modal", () => {
    it('Test for opened modal window', async function () {
        const wrap = await mount(container);

        const value = '123';

        promptModal(ModalPromptValue, {value})

        await wait(1);

        expect(wrap.text()).toEqual(value);
    });
    it("Should be returned with provided value", async function () {
        await mount(container);

        const value = Math.random();

        expect(await promptModal(ModalPromptValue, {
            value
        })).toEqual(value)

    })

})
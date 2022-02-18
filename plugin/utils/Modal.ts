/**
 * last change: 18.02.2022
 * */

import {
    Component,
    computed,
    ComputedRef,
    reactive,
    ref,
    Ref,
    shallowRef
} from "vue";
import {guards, modalQueue} from "./state";
import {GuardFunctionWithHandle} from "./types";
import closeById from "../methods/closeById";
import {getInstance} from "./instances";
import ModalError from "./ModalError";


type EventCallback = (data?: any) => any;

/**
 * Value can be an EventCallback[]
 * В Будущем можно обновить методы on и emit и сделать так, чтобы они работали
 * с массивом эвентов.
 * */
export interface EventCallbacksStorage {
    [name: string]: EventCallback
}

export default class Modal{
    /**
     * @description Unique id of each modal window.
     * */
    public id:number;

    /**
     * @description Computed value. True - when the modal was closed.
     * */
    public closed: ComputedRef;

    /**
     * @description VueComponent that will be mounted like modal.
     * */
    public component: Component

    /**
     * @description Props for VueComponent.
     * */
    public props: Ref;


    protected static modalId = 0;

    /**
     * @description Storage for events.
     * modal.on(eventName, callback) will makeStorage: {eventName: callback}
     * */
    public eventCallbacks:EventCallbacksStorage = reactive({})


    /**
     * Создаёт объект управления модальным окном.
     * Для управления идентификатором используется статическое поле modalId.
     * ЕСЛИ В КОМПОНЕНТЕ ЕСТЬ beforeModalClose параметр, то добавляем его в guards
     *
     * @param {Object} component Any VueComponent that will be used like modal window
     * @param {Object} props Object of input params. Used like props.
     * */
    constructor(component: Component | any, props: any) {
        this.id         = Modal.modalId++;
        this.component  = component;

        this.props     = ref(props);

        /**
         * БЛЯТЬ, ПОЧЕМУ ОНО ТАК?
         * ОТВЕТ: ЭТОТ ЕБУЧИЙ ВЬЮ, ПРИ ДОБАВЛЕНИИ В modalQueue
         * РАСКРЫВАЕТ COMPUTED(THIS.CLOSED) И КЛАДЁТ ТУДА ТУПО ЗНАЧЕНИЕ, А НЕ
         * COMPUTED PROP {VALUE: BOOLEAN}
         * ЧТО ЛОГИЧНО, НО ПО УЕБАНСКИ
         * ----
         * Более деликатное объяснение:
         * Раньше в modalQueue ложили просто объект Modal.
         * modalQueue.value.push(Modal)
         * Т.к. modalQueue является реактивным объектом, оно автоматически делает
         * реактивным и все свойства объекта, который кладётся в него. И у нас
         * closed.value пропадало, оставалось лишь closed. Т.к. modalQueue и так
         * полностью реактивно.
         * Сейчас в modalQueue кладётся markRaw(помечаем, что не надо делать об
         * ект реактивным). И close.value - остаётся
         *
         * 10.02.2022 @ЖЕНЯ, КОТОРЫЙ ЕЩЁ ПЛОХО ЗНАЕТ TS.
         * */
        this.closed = computed(() => !modalQueue.value.includes(this));

        /*
        this.closed = computed(
            () => !modalQueue.value.find(item => item.id === this.id)
        );
*/
        if (component.beforeModalClose)
            guards.add(this.id, "close", component.beforeModalClose);
    }

    /**
     * @description Method for closing the modal window
     * */
    public close() :Promise<void> {
        return closeById(this.id);
    }

    /**
     * @description Hook for handling modal closing
     * */
    public set onclose(func: GuardFunctionWithHandle) {
        guards.add(this.id, "close", func);
    }
    /**
     * @description Return instance of modal component
     * */
    public get instance(){
        return getInstance(this.id);
    }

    /**
     * @description Event handler
     * */
    public on(eventName: string, callback: EventCallback) {

        if (typeof eventName !== 'string') throw ModalError.ModalEventNameMustBeString(eventName);

        eventName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);

        // If eventName was added firstly
        /*
        if (!(eventName in this.eventCallbacks))
            this.eventCallbacks[eventName] = []
        */
        this.eventCallbacks[eventName] = callback.bind(this.instance);

    }

}

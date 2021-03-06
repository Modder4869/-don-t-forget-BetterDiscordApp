/**
 * BetterDiscord Settings Category Struct
 * Copyright (c) 2015-present Jiiks/JsSucks - https://github.com/Jiiks / https://github.com/JsSucks
 * All rights reserved.
 * https://betterdiscord.net
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Setting from './setting';
import { ClientLogger as Logger, AsyncEventEmitter } from 'common';
import { SettingUpdatedEvent, SettingsUpdatedEvent } from 'structs';

export default class SettingsCategory {

    constructor(args, ...merge) {
        this.emitter = new AsyncEventEmitter();
        this.args = args.args || args;

        this.args.settings = this.settings.map(setting => new Setting(setting));

        for (let newCategory of merge) {
            this._merge(newCategory);
        }

        for (let setting of this.settings) {
            setting.on('setting-updated', ({ value, old_value }) => this.emit('setting-updated', new SettingUpdatedEvent({
                category: this, category_id: this.id,
                setting, setting_id: setting.id,
                value, old_value
            })));
            setting.on('settings-updated', ({ updatedSettings }) => this.emit('settings-updated', new SettingsUpdatedEvent({
                updatedSettings: updatedSettings.map(updatedSetting => new SettingUpdatedEvent(Object.assign({
                    category: this, category_id: this.id
                }, updatedSetting)))
            })));
        }
    }

    /**
     * Category ID
     */
    get id() {
        return this.args.id || this.args.category;
    }

    get category() {
        return this.id;
    }

    /**
     * Category name
     */
    get name() {
        return this.args.category_name;
    }

    get category_name() {
        return this.name;
    }

    /**
     * Category type
     * Currently either "drawer", "static", or undefined.
     */
    get type() {
        return this.args.type;
    }

    /**
     * An array of settings in this category.
     */
    get settings() {
        return this.args.settings || [];
    }

    /**
     * Whether any setting in this category has been changed.
     */
    get changed() {
        if (this.settings.find(setting => setting.changed)) return true;
        return false;
    }

    /**
     * Returns the first setting where calling {function} returns true.
     * @param {Function} function A function to call to filter settings
     * @return {Setting}
     */
    find(f) {
        return this.settings.find(f);
    }

    /**
     * Returns all settings where calling {function} returns true.
     * @param {Function} function A function to call to filter settings
     * @return {Array} An array of matching Setting objects
     */
    findSettings(f) {
        return this.settings.filter(f);
    }

    /**
     * Returns the setting with the ID {id}.
     * @param {String} id The ID of the setting to look for
     * @return {Setting}
     */
    getSetting(id) {
        return this.findSetting(setting => setting.id === id);
    }

    /**
     * Merges a category into this category without emitting events (and therefore synchronously).
     * This only exists for use by the constructor and SettingsSet.
     */
    _merge(newCategory) {
        let updatedSettings = [];

        for (let newSetting of newCategory.settings) {
            const setting = this.settings.find(setting => setting.id === newSetting.id);
            if (!setting) {
                Logger.warn('SettingsCategory', `Trying to merge setting ${this.id}/${newSetting.id}, which does not exist.`);
                continue;
            }

            const updatedSetting = setting._merge(newSetting);
            if (!updatedSetting) continue;
            updatedSettings = updatedSettings.concat(updatedSetting.map(({ setting, value, old_value }) => ({
                category: this, category_id: this.id,
                setting, setting_id: setting.id,
                value, old_value
            })));
        }

        return updatedSettings;
    }

    /**
     * Merges another category into this category.
     * @param {SettingsCategory} newCategory The category to merge into this category
     * @return {Promise}
     */
    async merge(newCategory, emit_multi = true) {
        let updatedSettings = [];

        for (let newSetting of newCategory.settings) {
            const setting = this.settings.find(setting => setting.id === newSetting.id);
            if (!setting) {
                Logger.warn('SettingsCategory', `Trying to merge setting ${this.id}/${newSetting.id}, which does not exist.`);
                continue;
            }

            const updatedSetting = await setting.merge(newSetting, false);
            if (!updatedSetting) continue;
            updatedSettings = updatedSettings.concat(updatedSetting.map(({ setting, value, old_value }) => ({
                category: this, category_id: this.id,
                setting, setting_id: setting.id,
                value, old_value
            })));
        }

        if (emit_multi)
            await this.emit('settings-updated', new SettingsUpdatedEvent({
                updatedSettings
            }));

        return updatedSettings;
    }

    /**
     * Marks all settings in this set as saved (not changed).
     */
    setSaved() {
        for (let setting of this.settings) {
            setting.setSaved();
        }
    }

    /**
     * Returns an object that can be stored as JSON and later merged back into a category with settingscategory.merge.
     * @return {Object}
     */
    strip() {
        return {
            category: this.category,
            settings: this.settings.map(setting => setting.strip())
        };
    }

    /**
     * Returns a copy of this category that can be changed and then merged back into a set with settingscategory.merge.
     * @param {SettingsCategory} ...merge A set to merge into the new set
     * @return {SettingsCategory}
     */
    clone(...merge) {
        return new SettingsCategory({
            id: this.id,
            category: this.id,
            name: this.name,
            category_name: this.category_name,
            type: this.type,
            settings: this.settings.map(setting => setting.clone())
        }, ...merge);
    }

    on(...args) { return this.emitter.on(...args); }
    off(...args) { return this.emitter.removeListener(...args); }
    emit(...args) { return this.emitter.emit(...args); }

}

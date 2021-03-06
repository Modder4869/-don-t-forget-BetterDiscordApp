/**
 * BetterDiscord Plugins View Component
 * Copyright (c) 2015-present Jiiks/JsSucks - https://github.com/Jiiks / https://github.com/JsSucks
 * All rights reserved.
 * https://betterdiscord.net
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

<template>
    <SettingsWrapper headertext="Plugins">
        <div class="bd-tabbar" slot="header">
            <div class="bd-button" :class="{'bd-active': local}" @click="showLocal">
                <h3>Installed</h3>
                <RefreshBtn v-if="local" :onClick="refreshLocal" />
            </div>
            <div class="bd-button" :class="{'bd-active': !local}" @click="showOnline">
                <h3>Browse</h3>
                <RefreshBtn v-if="!local" :onClick="refreshOnline" />
            </div>
        </div>

        <div class="bd-flex bd-flex-col bd-pluginsview">
            <div v-if="local" class="bd-flex bd-flex-grow bd-flex-col bd-plugins-container bd-local-plugins">
                <PluginCard v-for="plugin in localPlugins" :plugin="plugin" :key="plugin.id" :togglePlugin="() => togglePlugin(plugin)" :reloadPlugin="() => reloadPlugin(plugin)" :deletePlugin="e => deletePlugin(plugin, e.shiftKey)" :showSettings="() => showSettings(plugin)" />
            </div>
            <div v-if="!local" class="bd-online-ph">
                <h3>Coming Soon</h3>
                <a href="https://v2.betterdiscord.net/plugins" target="_new">Website Browser</a>
            </div>
        </div>
    </SettingsWrapper>
</template>

<script>
    // Imports
    import { PluginManager } from 'modules';
    import { Modals } from 'ui';
    import { SettingsWrapper } from './';
    import PluginCard from './PluginCard.vue';
    import { MiRefresh } from '../common';
    import RefreshBtn from '../common/RefreshBtn.vue';

    export default {
        data() {
            return {
                local: true,
                localPlugins: PluginManager.localPlugins
            }
        },
        components: {
            SettingsWrapper, PluginCard,
            MiRefresh,
            RefreshBtn
        },
        methods: {
            showLocal() {
                this.local = true;
            },
            showOnline() {
                this.local = false;
            },
            async refreshLocal() {
                await PluginManager.refreshPlugins();
            },
            async refreshOnline() {

            },
            async togglePlugin(plugin) {
                // TODO Display error if plugin fails to start/stop
                try {
                    await plugin.enabled ? PluginManager.stopPlugin(plugin) : PluginManager.startPlugin(plugin);
                    this.$forceUpdate();
                } catch (err) {
                    console.log(err);
                }
            },
            async reloadPlugin(plugin) {
                try {
                    await PluginManager.reloadPlugin(plugin);
                    this.$forceUpdate();
                } catch (err) {
                    console.log(err);
                }
            },
            async deletePlugin(plugin, unload) {
                try {
                    if (unload) await PluginManager.unloadPlugin(plugin);
                    else await PluginManager.deletePlugin(plugin);
                    this.$forceUpdate();
                } catch (err) {
                    console.error(err);
                }
            },
            showSettings(plugin) {
                return Modals.contentSettings(plugin);
            }
        }
    }
</script>

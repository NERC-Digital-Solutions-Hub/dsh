<script lang="ts">
    import { onMount } from 'svelte';

    let htmlContent = '';
    let error = '';

    onMount(async () => {
        try {
            // Fetch the external HTML file
            const response = await fetch('/landing-content.html');
            if (!response.ok) throw new Error('Failed to load content');
            htmlContent = await response.text();
        } catch (err) {
            error = 'Could not load the introduction content.';
            console.error(err);
        }
    });
</script>

<div class="testing-introduction-wrapper">
    {#if error}
        <p class="text-danger">{error}</p>
    {:else if htmlContent}
        {@html htmlContent}
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style>
    /* Component specific wrapper styles */
    .testing-introduction-wrapper {
        width: 100%;
        height: 100%;
    }
</style>
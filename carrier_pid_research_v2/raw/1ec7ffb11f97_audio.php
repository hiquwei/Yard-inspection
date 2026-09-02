<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Audio help, tips, and techniques</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link rel="SHORTCUT ICON" href="https://archive.org/images/glogo.jpg"/>
    <style>
      body, html {
        padding: 0;
        margin: 0;
        font-size: 10px; /*nav quirk*/
      }
      #wrap {
        font-size: 16px; /*reset*/
      }
    </style>
    <script src="https://esm.ext.archive.org/@internetarchive/ia-topnav@^1.3.15" type="module"></script>
        <script src="//archive.org/includes/build/js/play8.min.js?v=741d564a" type="text/javascript"></script>
  </head>
  <body class="navia  ">
    <ia-topnav waybackPagesArchived="1 trillion"></ia-topnav>
    <div id="wrap">
    <link href="https://esm.ext.archive.org/bootstrap@3.3.7/dist/css/bootstrap.min.css"  rel="stylesheet"><style>
#boxy input.code {
  margin: 5px;
  background-color: #d0d0f0;
}
#boxy li { margin-bottom:10px; }
#boxy em { padding-left:10px; }
.topinblock { vertical-align: top; display: inline-block; }
.roundbox5 { border-radius:5px; }
</style>
<div id="boxy" style="margin-left:50px;" class="box">
  <h1>Audio help, tips, and techniques</h1>

  
  <br/>
  <br/>
  <h2>Permalinks</h2>

  Whenever you refer to files at archive.org,
  use our <a href="https://en.wikipedia.org/wiki/Permalink">permalink</a>-style
  form for the file within the item.  It is of the form<br/>
  https://archive.org/download/IDENTIFIER/FILE
  <div class="alert alert-success">
    <h4>Good:</h4>
    <a href="https://archive.org/download/etree/etree_itemimage.png">https://archive.org/download/etree/etree_itemimage.png</a><br/>
    <i>Great job!  If we ever move your item around on our servers or migrate
    our storage system, you're covered for life!</i>
  </div>

  <div class="alert alert-danger">
    <h4>Bad:</h4>
    <a href="https://ia802307.us.archive.org/8/items/etree/etree_itemimage.png">
      https://ia802307.us.archive.org/8/items/etree/etree_itemimage.png
    </a>
    <br/>
    <i>Uh-oh!  If we ever move your item around on our servers or migrate
    our storage system, this link could stop working.
    </i>
  </div>

  <br/>
  <br/>


  <h2>Audio embedding</h2>

  This allows you to setup an audio player that serves an item from
  archive.org on another site like Wordpress, a blog, or a website.

  <div class="alert alert-danger">
    NOTE: We've tested EMBED on tumblr.com, boingboing.net, blogspot.com blogs, and
    Wordpress blogs.
  </div>

  <h4>Feature notes:</h4>

  <ul>
    <li>
      <b>Playlists</b><br/>
      As of mid-January 2012, we support playlists! (see below)
    </li>
      </ul>

  <h4>How to embed and options:</h4>

  <ul>
    <li>
      <b>Example full embed code:</b><br>
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013&quot; width=&quot;500&quot; height=&quot;30&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=30&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013">
      Show me!
    </a>
  </div>
      </li>
    <li>
      You can see our new
      <a href="https://en.wikipedia.org/wiki/Permalink">permalink</a>-style
      embed codes with our new audio player.
              Find the player's "controlbar"
        (where the play/pause, seeking, time, etc. are located).</br>
        Now look for the Internet Archive logo (looks like: <div class="topinblock roundbox5"
         style="padding:2px; width:20px; height:20px; background-color:#333;"><img
          style="width:20px; height:20px;"
          src="https://av.archive.org/jw/glogo20x20.png"></div>)
          in the "controlbar" and <b>click it</b>
          for the iframe-based embed code and the linked image
          "Embedding Tips &amp; Help" (to a page with other examples).
            <br/>Some sample ways to customize the behaviour of the "embed" urls,
      used within the embed code above, follow.
    <li>
      <b>Embeds an audio item</b>.<br/>
      If the item contains 2+ playable uploaded files, this embeds
      all of the files within the item by default, sorted "naturally"
      (mostly alphabetically, via our backend PHP code):
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013&quot; width=&quot;500&quot; height=&quot;30&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=30&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013">
      Show me!
    </a>
  </div>
      </li>
    <li>
      <b>Embed audio with "autoplay"</b>:<br/>
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013?autoplay=1&quot; width=&quot;500&quot; height=&quot;30&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=30&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013%3Fautoplay%3D1">
      Show me!
    </a>
  </div>
      </li>
    <li>
      <b>Embed audio with clickable "playlist"</b>:<br/>
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013?playlist=1&quot; width=&quot;500&quot; height=&quot;300&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=300&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013%3Fplaylist%3D1">
      Show me!
    </a>
  </div>
      </li>
    <li>
      <b>Embed audio with clickable "playlist" and specific list height</b>:<br/>
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013?playlist=1&amp;amp;list_height=150&quot; width=&quot;500&quot; height=&quot;300&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=300&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013%3Fplaylist%3D1%26list_height%3D150">
      Show me!
    </a>
  </div>
      </li>
    <li>
      <b>Embed audio with clickable "playlist" *and* "autoplay"</b>:<br/>
        <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/aastra-ip-matrix-2108-2013?playlist=1&amp;amp;autoplay=1&quot; width=&quot;500&quot; height=&quot;300&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=300&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Faastra-ip-matrix-2108-2013%3Fplaylist%3D1%26autoplay%3D1">
      Show me!
    </a>
  </div>
      </li>
    <li>
      <b>Embed a single specific audio file for item with 2+
      audio files</b>:<br/>
      Notice you use the name of the "original" audio file that was uploaded
      (and we figure out what additional formats we were able to
      transcode/"<a href="derivatives.php">derive</a>"
      from and then figure out what the audio player can handle).
              <div class="alert alert-danger">
          NOTE: using a *different* item with 2+ audio files, to show
          specific single file usage...
        </div>
              <input class="code form-control" type="text" size="100" value="&lt;iframe src=&quot;https://archive.org/embed/jj2008-06-14.mk4/jj2008-06-14d2t04.flac&quot; width=&quot;500&quot; height=&quot;30&quot; frameborder=&quot;0&quot; webkitallowfullscreen=&quot;true&quot; mozallowfullscreen=&quot;true&quot; allowfullscreen&gt;&lt;/iframe&gt;"/>
  <div style="font-weight:bold; padding-left:50px; margin-bottom:20px;">
    <!-- nosemgrep: php.lang.security.taint-unsafe-echo-tag.taint-unsafe-echo-tag -->
    <a href="/help/audio.php?identifier=aastra-ip-matrix-2108-2013&ht=30&wd=500&url=https%3A%2F%2Farchive.org%2Fembed%2Fjj2008-06-14.mk4%2Fjj2008-06-14d2t04.flac">
      Show me!
    </a>
  </div>
      </li>
        <li>
      <b>Advanced/rare: Embed videos or audio from more than one item into a playlist</b>:
      <ul>
        <li>
          There is a <a href="playlist.htm">basic example here</a>
        </li>
        <li>
          EVEN SIMPLER text-based simple file:
          <a href="player.htm">basic embeddable, responsive playlist here</a>
          (try "view source"!)
        </li>
      </ul>
    </li>
  </ul>
  <br/>
  <br/>
</div>

import plotly.graph_objects as go

from citadel.pe.meta import get_shannon_entropy


def entropy_to_color(entropy: float) -> str:
    """Maps entropy values to traffic light colors.

    Args:
        entropy: Entropy value to map

    Returns:
        Hex color code string
    """
    if entropy <= 2.67:
        return "#00CC00"  # Vibrant green
    elif entropy <= 5.33:
        return "#FFD700"  # Golden yellow
    return "#FF4444"  # Soft red


def get_file_entropy_chart(
    data: bytearray, window_size: int = 256, step: int = 256
) -> dict:
    """Creates a professional entropy analysis visualization.

    Args:
        data: File data to analyze
        window_size: Size of analysis window (default: 256)
        step: Step size between windows (default: 256)

    Returns:
        Dict containing file path and chart title
    """
    # Calculate entropy values
    total_length = len(data)
    entropy_values = []
    positions = []

    for start in range(0, total_length - window_size + 1, step):
        chunk = data[start : start + window_size]
        entropy = get_shannon_entropy(chunk)
        entropy_values.append(entropy)
        positions.append(start)

    full_entropy = get_shannon_entropy(data)
    max_entropy = max(max(entropy_values), full_entropy) * 1.1

    # Create figure
    fig = go.Figure()

    # Add chunk entropy trace
    fig.add_trace(
        go.Scatter(
            x=positions,
            y=entropy_values,
            mode="lines+markers",
            name="Chunk Entropy",
            line=dict(color="#1E90FF", width=2.5, shape="spline"),  # Dodger blue
            marker=dict(
                size=10,
                color=[entropy_to_color(e) for e in entropy_values],
                line=dict(width=1.5, color="#333333"),
                opacity=0.8,
            ),
            hovertemplate="Position: %{x}<br>Entropy: %{y:.2f} bits",
        )
    )

    # Add full file entropy reference line
    fig.add_trace(
        go.Scatter(
            x=[0, positions[-1]],
            y=[full_entropy, full_entropy],
            mode="lines",
            name="Full File Entropy",
            line=dict(color="#FF4500", width=2.5, dash="dashdot"),  # Orange red
            hovertemplate="Full Entropy: %{y:.2f} bits",
        )
    )

    # Add annotation
    fig.add_annotation(
        x=positions[-1] * 0.95,
        y=full_entropy,
        text=f"Full File: {full_entropy:.2f} bits",
        showarrow=True,
        arrowhead=2,
        arrowsize=1,
        arrowwidth=2,
        ax=20,
        ay=-30,
        bgcolor="rgba(255, 255, 255, 0.8)",
        bordercolor="#666666",
        borderwidth=1,
        font=dict(size=14, color="#333333"),
    )

    # Customize layout
    fig.update_layout(
        xaxis=dict(
            title=dict(text="Byte Position", font=dict(size=16)),
            gridcolor="rgba(200, 200, 200, 0.3)",
            zeroline=False,
        ),
        yaxis=dict(
            title=dict(text="Entropy (bits)", font=dict(size=16)),
            range=[0, max_entropy],
            gridcolor="rgba(200, 200, 200, 0.3)",
            zeroline=False,
        ),
        height=650,
        width=1400,
        margin=dict(l=80, r=80, t=100, b=80),
        paper_bgcolor="#FFFFFF",
        plot_bgcolor="#F9F9F9",
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01,
            bgcolor="rgba(255, 255, 255, 0.9)",
            bordercolor="#CCCCCC",
            borderwidth=1,
            font=dict(size=12),
        ),
        font=dict(family="Arial", size=14, color="#333333"),
        hovermode="x unified",
        showlegend=True,
    )

    # Export high-quality image
    output_file = "/tmp/entropy_heatmap.png"
    fig.write_image(output_file, scale=4, engine="kaleido")

    return {"file_path": output_file, "title": "File Entropy Analysis"}
